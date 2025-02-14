const loginWith = async (page, username, password)  => {
  await page.getByTestId('username-input').fill(username)
  await page.getByTestId('password-input').fill(password)
  await page.getByRole('button', { name: 'Login' }).click()
}

const createNewBlog = async (page, title, author, url)  => {
  await page.getByRole('button', { name: 'New blog' }).click()
  await page.getByTestId('blog-title-input').fill(title)
  await page.getByTestId('blog-author-input').fill(author)
  await page.getByTestId('blog-url-input').fill(url)
  await page.getByRole('button', { name: 'Create' }).click()
}

export { loginWith, createNewBlog }