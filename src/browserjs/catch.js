let yearContent, makeContent, modelContent, typeContent, engineContent
const parser = new DOMParser()
const xmlDoc = parser.parseFromString(window.lastResult, 'text/xml')
const partsDataElements = xmlDoc.getElementsByTagName('partsdata')
console.log(partsDataElements)
if (partsDataElements.length > 0) {
  await makeFetchRequest(
    yearContent,
    makeContent,
    modelContent,
    typeContent,
    engineContent
  )
}
const responseParser = result => {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(result, 'text/xml')
  console.log(xmlDoc)
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
        const text = responseParser(self.responseText)
        console.log(text)
        window.lastResult = self.responseText
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
const sleep = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))
const clickAndWait = async (element, time) => {
  element.click()
  await sleep(time)
}

const makeFetchRequest = async (year, make, model, type, engine) => {
  try {
    // const response = await fetch('http://localhost:8080/api/parts/add', {
    const response = await fetch('http://3.18.104.4:8080/api/parts/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        xmlString: window.lastResult,
        year,
        make,
        model,
        type,
        engine
      })
    })
    const data = await response.json()
    console.log('Fetch response:', data)
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

const getEngines = async () => {
  // 循环处理 engines
  const engines = document.getElementById('combo-1064-picker-listEl')?.children
  if (engines) {
    const enginesArray = Array.from(engines)
    if (enginesArray.length > 0) {
      for (let engine of enginesArray) {
        engineContent = engine.textContent || 'All'
        await clickAndWait(engine, 2000)
      }
    }
  }
}
const getType = async () => {
  const typeInput = document.getElementById('combo-1063-inputEl')
  const types = document.getElementById('combo-1063-picker-listEl')?.children
  if (typeInput.value) {
    await getEngines()
  } else {
    // Loop through parts
    if (types) {
      const typesArray = Array.from(types)
      if (typesArray.length > 0) {
        for (let type of typesArray) {
          typeContent = type.textContent
          await clickAndWait(type, 1000)
          await getEngines()
        }
      }
    } else {
      await getEngines()
    }
  }
}

const getModels = async () => {
  const modelInput = document.getElementById('combo-1062-inputEl')
  const models = document.getElementById('combo-1062-picker-listEl')?.children
  if (modelInput.value) {
    const modelsArray = Array.from(models)
    const startIndex = modelsArray.findIndex(
      model => model.textContent === modelInput.value
    )
    if (startIndex !== -1) {
      for (let i = startIndex; i < modelsArray.length; i++) {
        const model = modelsArray[i]
        modelContent = model.textContent
        await clickAndWait(model, 1000)
        await getType()
      }
    } else {
      console.error('Model not found in the list')
    }
  } else {
    // Loop through models
    if (models) {
      const modelsArray = Array.from(models)
      if (modelsArray.length > 0) {
        for (let model of modelsArray) {
          modelContent = model.textContent
          await clickAndWait(model, 1000)
          await getType()
        }
      }
    } else {
      await getType()
    }
  }
}
const getMakes = async () => {
  const makeInput = document.getElementById('combo-1061-inputEl')
  const makes = document.getElementById('combo-1061-picker-listEl')?.children
  if (makeInput.value) {
    const makesArray = Array.from(makes)
    const startIndex = makesArray.findIndex(
      make => make.textContent === makeInput.value
    )
    if (startIndex !== -1) {
      for (let i = startIndex; i < makesArray.length; i++) {
        const make = makesArray[i]
        makeContent = make.textContent
        await clickAndWait(make, 1000)
        await getModels()
      }
    } else {
      console.error('Make not found in the list')
    }
  } else {
    // Loop through makes
    if (makes) {
      const makesArray = Array.from(makes)
      if (makesArray.length > 0) {
        for (let make of makesArray) {
          makeContent = make.textContent
          await clickAndWait(make, 2000)
          await getModels()
        }
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
  if (yearInput.value) {
    const startIndex = yearsArray.findIndex(
      year => year.textContent === yearInput.value
    )
    if (startIndex !== -1) {
      for (let i = startIndex; i < yearsArray.length; i++) {
        const year = yearsArray[i]
        yearContent = year.textContent
        await clickAndWait(year, 2000)
        await getMakes()
      }
    } else {
      console.error('Year not found in the list')
    }
  } else {
    // 主循环，遍历 years 列表
    for (let year of yearsArray) {
      yearContent = year.textContent
      await clickAndWait(year, 2000)
      await getMakes()
    }
  }
}

catchData()
