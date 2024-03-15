const responseParser = result => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(result, 'text/xml')
  return xmlDoc
}
let yearContent = ''
let makeContent = ''
let modelContent = ''
let typeContent = ''
let engineContent = ''
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
    const handleLoad = async () => {
      if (self.status >= 200 && self.status < 300) {
        window.lastResult = self.responseText
        const result = responseParser(window.lastResult).documentElement.tagName
        if (result == 'ShowMeThePartsDetail') {
          await makeFetchRequest(
            window.lastResult,
            yearContent,
            makeContent ||
              document.getElementById('combo-1061-inputEl').value ||
              'All',
            modelContent ||
              document.getElementById('combo-1062-inputEl').value ||
              'All',
            typeContent ||
              document.getElementById('combo-1063-inputEl').value ||
              'All',
            engineContent ||
              document.getElementById('combo-1064-inputEl').value ||
              'All'
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
    if (enginesArray.length > 1) {
      for (let engine of enginesArray) {
        engine.click()
        await new Promise((resolve, reject) => {
          setTimeout(resolve, 5000)
        })
      }
    } else {
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 5000)
      })
    }
  }
}
const getTypes = async () => {
  const typeInput = document.getElementById('combo-1063-inputEl')
  const types = document.getElementById('combo-1063-picker-listEl')?.children
  let targetNodeExistsInitially = document.getElementById('loadmask-1433')
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
      if (!targetNodeExistsInitially && typesArray.length > 0) {
        typesArray[0].click()
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      if (typesArray.length > 1) {
        for (let type of typesArray) {
          typeContent = type.innerHTML
          await waitForNextList(type, 'loadmask-1433')
          await getEngines()
        }
      } else {
        typeContent = typesArray[0].innerHTML
        await getEngines()
      }
    }
  }
}

const getModels = async () => {
  const modelInput = document.getElementById('combo-1062-inputEl')
  const models = document.getElementById('combo-1062-picker-listEl')?.children
  let targetNodeExistsInitially = document.getElementById('loadmask-1431')
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
      if (!targetNodeExistsInitially && modelsArray.length > 0) {
        modelsArray[0].click()
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      for (let model of modelsArray) {
        modelContent = model.innerHTML
        await waitForNextList(model, 'loadmask-1431')
        await getTypes()
      }
    }
  }
}
const getMakes = async () => {
  const makeInput = document.getElementById('combo-1061-inputEl')
  const makes = document.getElementById('combo-1061-picker-listEl')?.children
  let targetNodeExistsInitially = document.getElementById('loadmask-1429')
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
      if (!targetNodeExistsInitially && makesArray.length > 0) {
        makesArray[0].click()
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      for (let make of makesArray) {
        makeContent = make.innerHTML
        await waitForNextList(make, 'loadmask-1429')
        await getModels()
      }
    }
  }
}

const catchData = async () => {
  const yearInput = document.getElementById('combo-1060-inputEl')
  const years = document.getElementById('combo-1060-picker-listEl').children
  const yearsArray = Array.from(years)
  let targetNodeExistsInitially = document.getElementById('loadmask-1427')
  if (yearInput) {
    const yearIndex = yearsArray.findIndex(
      year => year.textContent.trim() === yearInput.value
    )
    if (yearIndex !== -1) {
      yearsArray.splice(0, yearIndex)
    }
  }
  if (!targetNodeExistsInitially && yearsArray.length > 0) {
    yearsArray[0].click()
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  for (let year of yearsArray) {
    yearContent = year.innerHTML
    await waitForNextList(year, 'loadmask-1427')
    await getMakes()
  }
}
const waitForNextList = (element, targetId) => {
  return new Promise((resolve, reject) => {
    const checkAndObserve = () => {
      const targetNode = document.getElementById(targetId)
      if (targetNode) {
        const observer = new MutationObserver(mutations => {
          for (let mutation of mutations) {
            if (mutation.attributeName === 'style') {
              if (targetNode.style.display === 'none') {
                observer.disconnect()
                resolve()
              }
            }
          }
        })
        observer.observe(targetNode, { attributes: true })
        element.click()
      } else {
        element.click()
        setTimeout(() => {
          if (document.getElementById(targetId)) {
            checkAndObserve()
          } else {
            resolve()
          }
        }, 500)
      }
    }
    checkAndObserve()
  })
}
catchData()
