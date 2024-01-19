;(async function () {
  var oldOpen = XMLHttpRequest.prototype.open
  var oldSend = XMLHttpRequest.prototype.send

  window.lastResult = null // 用来存储最后一个请求的结果

  XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
    window.lastUrl = url // 在每次请求时更新URL
    oldOpen.call(this, method, url, async, user, pass)
  }

  XMLHttpRequest.prototype.send = function (data) {
    var self = this

    this.addEventListener('load', function () {
      window.lastResult = self.responseText // 存储请求的响应数据
    })

    oldSend.call(this, data)
  }
})()

const sleep = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

const clickAndWait = async element => {
  element.click()
  await sleep(1000) // 等待异步操作完成，可以根据实际情况调整等待时间
}

const catchData = async () => {
  // 获取 years 列表
  const years = document.getElementById('combo-1060-picker-listEl').children
  if (!years) {
    console.error("Element with ID 'combo-1060-picker-listEl' not found.")
    return
  }
  const yearsArray = Array.from(years)
  // 主循环，遍历 years 列表
  for (let year of yearsArray) {
    await clickAndWait(year)
    // 循环处理 makes
    const makes = document.getElementById('combo-1061-picker-listEl').children
    const makesArray = Array.from(makes)
    for (let make of makesArray) {
      await clickAndWait(make)
      // 循环处理 models
      const models = document.getElementById(
        'combo-1062-picker-listEl'
      ).children
      const modelsArray = Array.from(models)
      for (let model of modelsArray) {
        await clickAndWait(model)
        // 循环处理 parts
        const parts = document.getElementById(
          'combo-1063-picker-listEl'
        ).children
        for (let part of parts) {
          await clickAndWait(part)
          // 循环处理 engines
          const engines = document.getElementById(
            'combo-1064-picker-listEl'
          ).children
          for (let engine of engines) {
            await clickAndWait(engine)
            // resultArray.push(window.lastResult)
            console.log(window.lastResult)
            fetch('http://localhost:8081/api/parts/add', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: { xmlString: window.lastResult }
            })
            // console.log(resultArray)
          }
        }
      }
    }
  }
}

catchData()
