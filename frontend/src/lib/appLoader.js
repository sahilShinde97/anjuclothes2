export function hideAppLoader() {
  const loader = document.getElementById('app-loader')
  if (!loader || loader.dataset.hiding === 'true') {
    return
  }

  loader.dataset.hiding = 'true'
  loader.classList.add('app-loader--hide')

  const removeLoader = () => {
    if (loader.parentNode) {
      loader.remove()
    }
  }

  loader.addEventListener('transitionend', removeLoader, { once: true })
  window.setTimeout(removeLoader, 500)
}
