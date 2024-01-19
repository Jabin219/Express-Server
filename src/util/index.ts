import { DOMParser } from 'xmldom'

const xmlParser = (xmlString: string) => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml')
  return xmlToJson(xmlDoc.documentElement)
}

const xmlToJson = (xml: Node) => {
  let obj: any = {}

  if (xml.nodeType === 1) {
    // Element node
    const element = xml as Element

    for (let i = 0; i < element.attributes.length; i++) {
      const attribute = element.attributes[i]
      obj[attribute.nodeName] = attribute.nodeValue
    }

    for (let j = 0; j < xml.childNodes.length; j++) {
      const item = xml.childNodes[j]
      const nodeName = item.nodeName

      if (typeof obj[nodeName] === 'undefined') {
        obj[nodeName] = xmlToJson(item)
      } else {
        if (typeof obj[nodeName].push === 'undefined') {
          const old = obj[nodeName]
          obj[nodeName] = []
          obj[nodeName].push(old)
        }
        obj[nodeName].push(xmlToJson(item))
      }
    }
  } else if (xml.nodeType === 3) {
    // Text node
    if (xml.nodeValue !== null) {
      obj = xml.nodeValue.trim()
    }
  }

  return obj
}

export { xmlParser }
