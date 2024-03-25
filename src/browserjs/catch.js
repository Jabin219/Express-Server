const xmlToJson = xml => {
  let obj = {}
  if (xml.nodeType === 1) {
    const element = xml
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
    if (xml.nodeValue !== null) {
      obj = xml.nodeValue.trim()
    }
  }
  return obj
}
;(async function () {
  var oldOpen = XMLHttpRequest.prototype.open
  var oldSend = XMLHttpRequest.prototype.send
  window.lastResult = null
  XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
    this._url = url // 保存url到XHR对象上，供重试时使用
    this._method = method // 保存method到XHR对象上，供重试时使用
    this._async = async // 保存async标志到XHR对象上，供重试时使用
    this._user = user // 保存user到XHR对象上，供重试时使用
    this._pass = pass // 保存pass到XHR对象上，供重试时使用
    oldOpen.call(this, method, url, async, user, pass)
  }
  XMLHttpRequest.prototype.send = function (data) {
    var self = this
    var retryCount = 0
    var maxRetries = 3
    var retryDelay = 2000
    const handleLoad = async () => {
      if (self.status >= 200 && self.status < 300) {
        window.lastResult = self.responseText
        const parser = new DOMParser()
        const result = parser.parseFromString(window.lastResult, 'text/xml')
        const resultJson = xmlToJson(result.documentElement)
        if (result.documentElement.tagName == 'ShowMeThePartsDetail') {
          let yearContent =
            document.getElementById('combo-1060-inputEl').value || ''
          let makeContent =
            document.getElementById('combo-1061-inputEl').value || 'unknown'
          let modelContent =
            document.getElementById('combo-1062-inputEl').value || 'unknown'
          let typeContent =
            document.getElementById('combo-1063-inputEl').value || 'unknown'
          let engineContent =
            document.getElementById('combo-1064-inputEl').value || 'All'
          await makeFetchRequest(
            resultJson,
            yearContent,
            makeContent,
            modelContent,
            typeContent,
            engineContent
          )
        }
      } else {
        handleError()
      }
    }
    const handleError = () => {
      if (retryCount < maxRetries) {
        retryCount++
        setTimeout(function () {
          console.log(`Retry ${retryCount}/${maxRetries} for ${self._url}`)
          oldOpen.call(
            self,
            self._method,
            self._url,
            self._async,
            self._user,
            self._pass
          )
          self.addEventListener('load', handleLoad)
          self.addEventListener('error', handleError)
          oldSend.call(self, data)
        }, retryDelay * retryCount)
      } else {
        console.error(`Failed after ${maxRetries} retries`)
        let yearContent =
          document.getElementById('combo-1060-inputEl').value || ''
        let makeContent =
          document.getElementById('combo-1061-inputEl').value || 'unknown'
        let modelContent =
          document.getElementById('combo-1062-inputEl').value || 'unknown'
        let typeContent =
          document.getElementById('combo-1063-inputEl').value || 'unknown'
        let engineContent =
          document.getElementById('combo-1064-inputEl').value || 'All'
        console.log(
          yearContent,
          makeContent,
          modelContent,
          typeContent,
          engineContent
        )
        return
      }
    }
    this.addEventListener('load', handleLoad)
    this.addEventListener('error', handleError)
    oldSend.call(this, data)
  }
})()

const makeFetchRequest = async (
  resultJson,
  year,
  make,
  model,
  type,
  engine
) => {
  try {
    // const response = await fetch('http://localhost:8081/api/parts/add', {
    const response = await fetch('http://3.18.104.4:8080/api/parts/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resultJson,
        year,
        make,
        model,
        type,
        engine
      })
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Fetch error:', error)
    console.log(`Error occurred with parameters:
      year: ${year},
      make: ${make},
      model: ${model},
      type: ${type},
      engine: ${engine}`)
    await makeFetchRequest(resultJson, year, make, model, type, engine)
  }
}
const getEngines = async () => {
  const engines = document.getElementById('combo-1064-picker-listEl')?.children
  if (engines) {
    const enginesArray = Array.from(engines)
    if (enginesArray.length > 1) {
      for (let engine of enginesArray) {
        engine.click()
        await new Promise(resolve => setTimeout(resolve, 8000))
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 8000))
    }
  }
}
const getTypes = async () => {
  const typeInput = document.getElementById('combo-1063-inputEl')
  const types = document.getElementById('combo-1063-picker-listEl')?.children
  if (types) {
    const typesArray = Array.from(types)
    if (typesArray.length > 1) {
      if (typeInput) {
        const typeIndex = typesArray.findIndex(
          type => type.textContent.trim() === typeInput.value
        )
        if (typeIndex !== -1) {
          typesArray.splice(0, typeIndex)
        }
      }
      for (let type of typesArray) {
        await waitForNextList(type, 'combo-1064-picker-listEl')
        await getEngines()
      }
    } else {
      await getEngines()
    }
  }
}

const getModels = async () => {
  const modelInput = document.getElementById('combo-1062-inputEl')
  const models = document.getElementById('combo-1062-picker-listEl')?.children
  if (models) {
    const modelsArray = Array.from(models)
    if (modelsArray.length > 1) {
      if (modelInput) {
        const modelIndex = modelsArray.findIndex(
          model => model.textContent.trim() === modelInput.value
        )
        if (modelIndex !== -1) {
          modelsArray.splice(0, modelIndex)
        }
      }
      for (let model of modelsArray) {
        await waitForNextList(model, 'combo-1063-picker-listEl')
        await getTypes()
      }
    } else {
      await getTypes()
    }
  }
}
const getMakes = async () => {
  const makeInput = document.getElementById('combo-1061-inputEl')
  const makes = document.getElementById('combo-1061-picker-listEl')?.children
  if (makes) {
    const makesArray = Array.from(makes)
    if (makesArray.length > 1) {
      if (makeInput) {
        const makeIndex = makesArray.findIndex(
          make => make.textContent.trim() === makeInput.value
        )
        if (makeIndex !== -1) {
          makesArray.splice(0, makeIndex)
        }
      }
      for (let make of makesArray) {
        await waitForNextList(make, 'combo-1062-picker-listEl')
        await getModels()
      }
    } else {
      await getModels()
    }
  }
}
const catchData = async () => {
  const yearInput = document.getElementById('combo-1060-inputEl')
  const years = document.getElementById('combo-1060-picker-listEl').children
  const yearsArray = Array.from(years)
  if (yearInput) {
    const yearIndex = yearsArray.findIndex(
      year => year.textContent.trim() === yearInput.value
    )
    if (yearIndex !== -1) {
      yearsArray.splice(0, yearIndex)
    }
  }
  for (let year of yearsArray) {
    await waitForNextList(year, 'combo-1061-picker-listEl')
    await getMakes()
  }
}
const waitForNextList = (element, nextId) => {
  const targetNode = document.getElementById(nextId)
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver((mutations, observer) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          observer.disconnect()
          setTimeout(resolve, 4000)
          return
        }
      }
    })
    if (targetNode) {
      observer.observe(targetNode, { childList: true })
    }
    element.click()
    setTimeout(() => {
      observer.disconnect()
      resolve()
    }, 10000)
  })
}
catchData()
