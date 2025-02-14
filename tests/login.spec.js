const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, createNewBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Name',
        username: 'user',
        password: 'password'
      }
    })
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    const loginForm = await page.getByTestId('login-form')
    await expect(loginForm).toBeVisible()
    await expect(loginForm.getByText('Log in to application')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'user', 'password')
      await expect(page.getByText('Name logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'wrong-user', 'wrong-password')
      await expect(page.getByText('Name logged in')).not.toBeVisible()
      await expect(page.getByText('Wrong username or password')).toBeVisible()
    })
  })

  describe('When logged in', () => {
    test('a new blog can be created', async ({ page }) => {
      await loginWith(page, 'user', 'password')
      await createNewBlog(page, 'Title', 'Author', 'blog.com')
      await expect(page.getByText('Title - Author')).toBeVisible()
    })
    test('a blog can be liked', async ({ page }) => {
      await loginWith(page, 'user', 'password')
      await createNewBlog(page, 'Title', 'Author', 'blog.com')
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('Likes: 0')).toBeVisible()
      await page.getByRole('button', { name: 'like' }).click()
      await expect(page.getByText('Likes: 0')).not.toBeVisible()
      await expect(page.getByText('Likes: 1')).toBeVisible()
    })
    test('a blog can be deleted by the user who added it', async ({ page }) => {
      await loginWith(page, 'user', 'password')
      await createNewBlog(page, 'Title', 'Author', 'blog.com')
      await page.getByRole('button', { name: 'view' }).click()
      page.on('dialog', dialog => {
        dialog.accept();
      });
      await page.getByRole('button', { name: 'delete' }).click()
      await expect(page.getByText('Title - Author')).not.toBeVisible()
    })
    test('only the user who added a blog can see its delete button', async ({ page, request }) => {
      await request.post('http://localhost:3003/api/users', {
        data: {
          name: 'Second user',
          username: 'second-user',
          password: 'second-password'
        }
      })
      // User 1 created a blog
      await loginWith(page, 'user', 'password')
      await createNewBlog(page, 'Title', 'Author', 'blog.com')
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByRole('button', { name: 'delete' })).toBeVisible()
      // User 1 logs out and user 2 logs in
      await page.getByRole('button', { name: 'Logout' }).click()
      await loginWith(page, 'second-user', 'second-password')
      // User 2 can see blog post but not delete button
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('Title - Author')).toBeVisible()
      await expect(page.getByRole('button', { name: 'delete' })).not.toBeVisible()
    })
    test('blogs are sorted in descending order according to number of likes', async ({ page, request }) => {
      await loginWith(page, 'user', 'password')
      await createNewBlog(page, 'First', 'Author1', 'blog1.com')
      await createNewBlog(page, 'Second', 'Author2', 'blog2.com')
      const blogs = await page.locator('.blog-item')
      // Blogs are in creation order
      await expect(blogs.nth(0)).toContainText('First - Author1')
      await expect(blogs.nth(1)).toContainText('Second - Author2')
      // Liking second blog
      await blogs.nth(1).locator('button:has-text("view")').click()
      await blogs.nth(1).locator('button:has-text("like")').click()
      // Order has changed
      await expect(blogs.nth(0)).toContainText('Second - Author2')
      await expect(blogs.nth(1)).toContainText('First - Author1')
    })
  })
})