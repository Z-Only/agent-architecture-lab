import { expect, it } from 'vitest'
it('mounts the actual production entrypoint', async () => {
  localStorage.clear()
  document.body.innerHTML = '<div id="app"></div>'
  await import('../../src/main')
  expect(document.querySelector('#app h1')?.textContent).toContain('Design the workflow')
  document.body.innerHTML = ''
})
