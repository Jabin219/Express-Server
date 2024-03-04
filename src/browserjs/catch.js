const responseParser = result => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(result, 'text/xml')
  return xmlDoc
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
    var maxRetries = 3 // 最大重试次数
    var retryDelay = 1000 // 重试之间的延时，单位毫秒
    const handleLoad = () => {
      if (self.status >= 200 && self.status < 300) {
        window.lastResult = self.responseText
        const result = responseParser(window.lastResult).documentElement.tagName
        if (result == 'ShowMeThePartsDetail') {
          let yearContent =
            document.getElementById('combo-1060-inputEl').value || null
          let makeContent =
            document.getElementById('combo-1061-inputEl').value || null
          let modelContent =
            document.getElementById('combo-1062-inputEl').value || null
          let typeContent =
            document.getElementById('combo-1063-inputEl').value || null
          let engineContent =
            document.getElementById('combo-1064-inputEl').value || 'All'
          makeFetchRequest(
            window.lastResult,
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
      }
    }
    this.addEventListener('load', handleLoad)
    this.addEventListener('error', handleError)
    oldSend.call(this, data)
  }
})()

const makeFetchRequest = async (xmlString, year, make, model, type, engine) => {
  try {
    // const response = await fetch('http://localhost:8081/api/parts/add', {
    const response = await fetch('http://3.18.104.4:8080/api/parts/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        xmlString,
        year,
        make,
        model,
        type,
        engine
      })
    })
    const data = await response.json()
    console.log('Fetch response:', data)
    return data
  } catch (error) {
    console.error('Fetch error:', error)
  }
}
const getEngines = async () => {
  const engines = document.getElementById('combo-1064-picker-listEl')?.children
  if (engines) {
    const enginesArray = Array.from(engines)
    if (enginesArray.length > 0) {
      for (let engine of enginesArray) {
        engine.click()
        await new Promise(resolve => setTimeout(resolve, 4000))
      }
    }
  }
}
const getTypes = async () => {
  const typeInput = document.getElementById('combo-1063-inputEl')
  const types = document.getElementById('combo-1063-picker-listEl')?.children
  if (types) {
    const typesArray = Array.from(types)
    if (typesArray.length > 0) {
      if (typeInput) {
        const typeIndex = typesArray.findIndex(
          type => type.textContent.trim() === typeInput.value
        )
        if (typeIndex !== -1) {
          typesArray.splice(0, modelsArray)
        }
      }
      for (let type of typesArray) {
        await waitForNextList(
          type,
          'combo-1064-picker-listEl',
          'combo-1064-trigger-picker'
        )
        await getEngines()
      }
    }
  }
}

const getModels = async () => {
  const modelInput = document.getElementById('combo-1062-inputEl')
  const models = document.getElementById('combo-1062-picker-listEl')?.children
  if (models) {
    const modelsArray = Array.from(models)
    if (modelsArray.length > 0) {
      if (modelInput) {
        const modelIndex = modelsArray.findIndex(
          model => model.textContent.trim() === modelInput.value
        )
        if (modelIndex !== -1) {
          modelsArray.splice(0, modelsArray)
        }
      }
      for (let model of modelsArray) {
        await waitForNextList(
          model,
          'combo-1063-picker-listEl',
          'combo-1063-trigger-picker'
        )
        await getTypes()
      }
    }
  }
}
const getMakes = async () => {
  const makeInput = document.getElementById('combo-1061-inputEl')
  const makes = document.getElementById('combo-1061-picker-listEl')?.children
  if (makes) {
    const makesArray = Array.from(makes)
    if (makesArray.length > 0) {
      if (makeInput) {
        const makeIndex = makesArray.findIndex(
          make => make.textContent.trim() === makeInput.value
        )
        if (makeIndex !== -1) {
          makesArray.splice(0, makeIndex)
        }
      }
      for (let make of makesArray) {
        await waitForNextList(
          make,
          'combo-1062-picker-listEl',
          'combo-1062-trigger-picker'
        )
        await getModels()
      }
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
    await waitForNextList(
      year,
      'combo-1061-picker-listEl',
      'combo-1061-trigger-picker'
    )
    await getMakes()
  }
}
const waitForNextList = (element, nextId, triggerId) => {
  const targetNode = document.getElementById(nextId)
  return new Promise((resolve, reject) => {
    if (!targetNode) {
      element.click()
      setTimeout(() => {
        resolve()
      }, 3000)
      return
    } else {
      while (targetNode.firstChild) {
        targetNode.removeChild(targetNode.firstChild)
      }
      const trigger = document.getElementById(triggerId)
      trigger.click()
    }
    const observer = new MutationObserver((mutations, observer) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          resolve()
          observer.disconnect()
        }
      }
    })
    observer.observe(targetNode, {
      childList: true
    })
    element.click()
  })
}
catchData()
