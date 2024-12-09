const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



let stopTask = false; // 全局停止标志
let stopTimeoutId = null; // 全局超时定时器 ID
let restartDelay = 1 * 60 * 1000; // 停止后重启的延迟时间（1分钟）

// 设置全局停止标志的函数
const setGlobalStopTimeout = (timeoutLimit = 4 * 60 * 1000) => {
  stopTimeoutId = setTimeout(() => {
    stopTask = true; // 设置停止标志
    console.log("4 minutes elapsed. Stopping current task...");
  }, timeoutLimit);
};

// 清理全局定时器
const clearGlobalStopTimeout = () => {
  if (stopTimeoutId) {
    clearTimeout(stopTimeoutId);
    stopTimeoutId = null;
    console.log("Global stop timeout cleared.");
  }
};




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
            document.getElementById('combo-1060-inputEl').value.trim() || ''
          let makeContent =
            document.getElementById('combo-1061-inputEl').value.trim() ||
            'unknown'
          let modelContent =
            document.getElementById('combo-1062-inputEl').value.trim() ||
            'unknown'
          let typeContent =
            document.getElementById('combo-1063-inputEl').value.trim() ||
            'unknown'
          let engineContent =
            document.getElementById('combo-1064-inputEl').value.trim() || 'All'
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
          document.getElementById('combo-1060-inputEl').value.trim() || ''
        let makeContent =
          document.getElementById('combo-1061-inputEl').value.trim() ||
          'unknown'
        let modelContent =
          document.getElementById('combo-1062-inputEl').value.trim() ||
          'unknown'
        let typeContent =
          document.getElementById('combo-1063-inputEl').value.trim() ||
          'unknown'
        let engineContent =
          document.getElementById('combo-1064-inputEl').value.trim() || 'All'
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

// 修改 makeFetchRequest 函数，在每次请求前后设置延迟
// 修改 makeFetchRequest 函数
const makeFetchRequest = async (resultJson, year, make, model, type, engine) => {
  // 如果 type 是 unknown，直接跳过 POST 请求
  if (type === 'unknown') {
    console.log('Skipping POST request because type is "unknown".');
    return null; // 返回 null 表示跳过了
  }

  // 延迟时间设置（以毫秒为单位）
  const delayTime = 1000; // 每次 POST 请求之间延迟 1 秒
  const timeoutLimit = 60000; // 超时时间 60 秒

  console.log(`Preparing to send POST request with data:`, {
    year,
    make,
    model,
    type,
    engine,
    parts: resultJson.partsdata,
  });

  // 使用 AbortController 来设置超时
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutLimit); // 设置超时触发

  try {
    // 延迟发送请求
    console.log(`Waiting ${delayTime / 1000} seconds before sending the request...`);
    await delay(delayTime);

    // 发送请求
    // const response = await fetch('http://47.92.144.20:8080/api/parts/add', {
      const response = await fetch('http://localhost:8081/api/parts/add', {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resultJson,
        year,
        make,
        model,
        type,
        engine,
      }),
      signal: controller.signal, // 绑定超时信号
    });

    // 清除超时定时器
    clearTimeout(timeout);

    // 检查响应状态
    if (!response.ok) {
      console.error(`POST request failed with status: ${response.status}`);
      return null; // 返回空结果以跳过后续处理
    }

    const data = await response.json();
    console.log(`POST request succeeded:`, data);

    // 延迟后
    console.log(`Waiting ${delayTime / 1000} seconds before next action...`);
    await delay(delayTime);

    return data;
  } catch (error) {
    clearTimeout(timeout); // 确保超时被清除
    if (error.name === 'AbortError') {
      console.error(`Request timeout (exceeded ${timeoutLimit / 1000} seconds).`);
    } else {
      console.error('Fetch error:', error);
    }
    console.log(`Error occurred with parameters:`, {
      year,
      make,
      model,
      type,
      engine,
      parts: resultJson.partsdata,
    });
    return null; // 返回空结果以跳过后续处理
  }
};

// 根据上次数据定位的函数
// 根据上次数据定位的函数
const locateLastPosition = async (lastData) => {
  console.log('获得上次抓取的位置:', {
    year: lastData.year,
    make: lastData.make,
    model: lastData.model,
    type: lastData.type,
    engine: lastData.engine,
  });
  const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *'));
  const yearIndex = years.findIndex((year) => year.textContent.trim() === lastData.year);
  if (yearIndex === -1) {
    console.error(`网页报错，未能找到年份，请重新刷新页面: ${lastData.year}`);
    return { success: false };
  }
  years[yearIndex].click();
  console.log(`定位到年份: ${lastData.year}`);
  await waitForNextList(years[yearIndex], 'combo-1061-picker-listEl');

  const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
  const makeIndex = makes.findIndex((make) => make.textContent.trim() === lastData.make);
  if (makeIndex === -1) {
    console.error(`未能找到品牌: ${lastData.make}`);
    return { success: false };
  }
  makes[makeIndex].click();
  console.log(`定位到品牌: ${lastData.make}`);
  await waitForNextList(makes[makeIndex], 'combo-1062-picker-listEl');

  const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
  const modelIndex = models.findIndex((model) => model.textContent.trim() === lastData.model);
  if (modelIndex === -1) {
    console.error(`未能找到车型，已自动调整为: ${lastData.model}`);
    return { success: true };
  }
  models[modelIndex].click();
  console.log(`定位到车型: ${lastData.model}`);
  await waitForNextList(models[modelIndex], 'combo-1063-picker-listEl');

  const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
  const typeIndex = types.findIndex((type) => type.textContent.trim() === lastData.type);
  if (typeIndex === -1) {
    console.error(`未能找到部件类型，已自动调整为: ${lastData.type}`);
    return { success: true };
  }
  types[typeIndex].click();
  console.log(`定位到部件类型: ${lastData.type}`);
  await waitForNextList(types[typeIndex], 'combo-1064-picker-listEl');

  const engines = Array.from(document.querySelectorAll('#combo-1064-picker-listEl > *'));
  const engineIndex = engines.findIndex((engine) => engine.textContent.trim() === lastData.engine);

  if (lastData.engine === 'All') {
    console.log('发动机类型为 "All"，已由网页自动选择。');
    return { success: true };
  } else if (engineIndex !== -1) {
    engines[engineIndex].click();
    console.log(`定位到发动机: ${lastData.engine}`);
    return { success: true };
  }

  console.error(`未能找到发动机，已自动调整为: ${lastData.engine}`);
  return { success: true };
};

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
          type => type.textContent.trim() === typeInput.value.trim()
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
          model => model.textContent.trim() === modelInput.value.trim()
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
          make => make.textContent.trim() === makeInput.value.trim()
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




// 修改 catchData 方法以支持全局停止标志
const catchData = async () => {
  const yearInput = document.getElementById('combo-1060-inputEl');
  const years = document.getElementById('combo-1060-picker-listEl').children;
  const yearsArray = Array.from(years);

  if (yearInput) {
    const yearIndex = yearsArray.findIndex(
      (year) => year.textContent.trim() === yearInput.value.trim()
    );
    if (yearIndex !== -1) {
      yearsArray.splice(0, yearIndex);
    }
  }

  for (let year of yearsArray) {
    if (stopTask) {
      console.log("Task stopped due to global timeout.");
      return; // 提前退出循环
    }

    console.log(`Processing year: ${year.textContent.trim()}`);
    await waitForNextList(year, 'combo-1061-picker-listEl');
    await getMakes();
  }

  console.log("catchData completed.");
};

// 修改 waitForNextList 方法以支持全局停止标志
const waitForNextList = (element, nextId) => {
    if (stopTask) return Promise.resolve(); // 如果任务停止，提前返回
  
    const targetNode = document.getElementById(nextId);
    return new Promise((resolve) => {
      // 检查目标节点是否已经加载内容
      if (targetNode && targetNode.children.length > 0) {
        console.log(`目标节点 ${nextId} 已有内容，强制重新选择`);
        element.click(); // 强制点击以触发重新加载
        setTimeout(() => resolve(), 15000); // 模拟等待行为
        return;
      }
  
      // 动态观察逻辑（适用于内容未加载时）
      const observer = new MutationObserver((mutations, observer) => {
        if (stopTask) {
          observer.disconnect();
          resolve(); // 停止观察并返回
          return;
        }
        for (let mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            observer.disconnect();
            console.log(`Page loaded for ${element.textContent.trim()}. Waiting for 15 seconds...`);
            setTimeout(resolve, 15000);
            return;
          }
        }
      });
  
      if (targetNode) {
        observer.observe(targetNode, { childList: true });
      }
  
      element.click(); // 模拟点击以触发加载
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 22000); // 超时保护
    });
  };

// 主任务逻辑：结合 locate 和 catchData
const fetchAndLocate = async () => {
  try {
    // stopTask = false; // 重置停止标志
    // setGlobalStopTimeout(); // 设置 N 分钟超时

    // const response = await fetch('http://47.92.144.20:8080/api/parts/latest');
    const response = await fetch('http://localhost:8081/api/parts/latest');

    if (response.ok) {
      const data = await response.json();
      const lastData = data.latestParts?.[0];
      if (lastData) {
        const locateResult = await locateLastPosition(lastData);
        if (locateResult.success) {
          console.log('定位成功，从上次记录继续抓取...');
          //set
          stopTask = false; // 重置停止标志
          setGlobalStopTimeout(); // 设置 N 分钟超时
          catchData(); // 定位成功后继续抓取剩余数据
        }
      }
    } else {
      console.error('未能获取到最新记录或定位失败');
    }
  } catch (error) {
    console.error('获取最新数据时出错:', error);
  } finally {
    await delay(4 * 60 * 1000); // 等待5分钟
    clearGlobalStopTimeout(); // 清理超时定时器
    console.log("1分钟后重新启动...");
    setTimeout(fetchAndLocate, restartDelay); // 两分钟后重新启动
  }
};

// 启动主任务
fetchAndLocate();