import { useEffect } from 'react'

function setMeta(selector, attribute, value) {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    const [attrName, attrValue] = attribute
    element.setAttribute(attrName, attrValue)
    document.head.appendChild(element)
  }

  element.setAttribute('content', value)
}

function usePageMeta({ title, description, image, url }) {
  useEffect(() => {
    if (title) {
      document.title = title
      setMeta('meta[property="og:title"]', ['property', 'og:title'], title)
      setMeta('meta[name="twitter:title"]', ['name', 'twitter:title'], title)
    }

    if (description) {
      setMeta('meta[name="description"]', ['name', 'description'], description)
      setMeta('meta[property="og:description"]', ['property', 'og:description'], description)
      setMeta('meta[name="twitter:description"]', ['name', 'twitter:description'], description)
    }

    if (image) {
      setMeta('meta[property="og:image"]', ['property', 'og:image'], image)
      setMeta('meta[name="twitter:image"]', ['name', 'twitter:image'], image)
    }

    if (url) {
      setMeta('meta[property="og:url"]', ['property', 'og:url'], url)
    }
  }, [description, image, title, url])
}

export default usePageMeta
