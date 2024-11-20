// 将 XML 转换为 JSON 的函数
const xmlToJson = xml => {
    let obj = {};
    if (xml.nodeType === 1) {
      const element = xml;
      for (let i = 0; i < element.attributes.length; i++) {
        const attribute = element.attributes[i];
        obj[attribute.nodeName] = attribute.nodeValue;
      }
      for (let j = 0; j < xml.childNodes.length; j++) {
        const item = xml.childNodes[j];
        const nodeName = item.nodeName;
        if (typeof obj[nodeName] === 'undefined') {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof obj[nodeName].push === 'undefined') {
            const old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    } else if (xml.nodeType === 3) {
      if (xml.nodeValue !== null) {
        obj = xml.nodeValue.trim();
      }
    }
    return obj;
  };
  
  // 重写 XMLHttpRequest 的 open 和 send 方法以处理重试
  (async function () {
    const oldOpen = XMLHttpRequest.prototype.open;
    const oldSend = XMLHttpRequest.prototype.send;
    window.lastResult = null;
  
    XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
      this._url = url; // 保存url到XHR对象上，供重试时使用
      this._method = method; // 保存method到XHR对象上，供重试时使用
      this._async = async; // 保存async标志到XHR对象上，供重试时使用
      this._user = user; // 保存user到XHR对象上，供重试时使用
      this._pass = pass; // 保存pass到XHR对象上，供重试时使用
      oldOpen.call(this, method, url, async, user, pass);
    };
  
    XMLHttpRequest.prototype.send = function (data) {
      const self = this;
      let retryCount = 0;
      const maxRetries = 3;
      const retryDelay = 2000;
  
      const handleLoad = async () => {
        if (self.status >= 200 && self.status < 300) {
          window.lastResult = self.responseText;
          const parser = new DOMParser();
          const result = parser.parseFromString(window.lastResult, 'text/xml');
          const resultJson = xmlToJson(result.documentElement);
  
          if (result.documentElement.tagName === 'ShowMeThePartsDetail') {
            let yearContent =
              document.getElementById('combo-1060-inputEl').value.trim() || '';
            let makeContent =
              document.getElementById('combo-1061-inputEl').value.trim() ||
              'unknown';
            let modelContent =
              document.getElementById('combo-1062-inputEl').value.trim() ||
              'unknown';
            let typeContent =
              document.getElementById('combo-1063-inputEl').value.trim() ||
              'unknown';
            let engineContent =
              document.getElementById('combo-1064-inputEl').value.trim() || 'All';
  
            await makeFetchRequest(resultJson, yearContent, makeContent, modelContent, typeContent, engineContent);
          }
        } else {
          handleError();
        }
      };
  
      const handleError = () => {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            console.log(`Retry ${retryCount}/${maxRetries} for ${self._url}`);
            oldOpen.call(self, self._method, self._url, self._async, self._user, self._pass);
            self.addEventListener('load', handleLoad);
            self.addEventListener('error', handleError);
            oldSend.call(self, data);
          }, retryDelay * retryCount);
        } else {
          console.error(`Failed after ${maxRetries} retries`);
          return;
        }
      };
  
      this.addEventListener('load', handleLoad);
      this.addEventListener('error', handleError);
      oldSend.call(this, data);
    };
  })();
  
  // 发送数据到后端的函数
  const makeFetchRequest = async (resultJson, year, make, model, type, engine) => {
    const postData = {
      resultJson,
      year,
      make,
      model,
      type,
      engine,
    };
  
    console.log('准备发送以下数据到后端:', postData);
  
    try {
      const response = await fetch('http://localhost:8081/api/parts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      console.log(`插入了 ${data.insertCount || 0} 条记录，返回数据:`, data);
  
      if (data.error) {
        console.error('后端返回错误信息:', data.error);
      }
      if (data.warnings) {
        console.warn('后端返回警告信息:', data.warnings);
      }
  
      return data;
    } catch (error) {
      console.error('提交数据到后端失败:', error);
  
      console.log('尝试重新发送请求...');
      await makeFetchRequest(resultJson, year, make, model, type, engine);
    }
  };
  
  // 等待下一个列表加载的函数
  const waitForNextList = (element, nextId) => {
    const targetNode = document.getElementById(nextId);
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            observer.disconnect();
            setTimeout(resolve, 4000); // 增加等待时间，确保加载完成
            return;
          }
        }
      });
      if (targetNode) {
        observer.observe(targetNode, { childList: true });
      }
      element.click();
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 8000); // 如果没有触发观察器，8秒后继续
    });
  };
  
  // 定位上次抓取位置的函数
  const locateLastPosition = async (lastData) => {
    console.log('定位到上次抓取的位置:', lastData);
  
    const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *'));
    const yearIndex = years.findIndex((year) => year.textContent.trim() === lastData.year);
    if (yearIndex === -1) {
      console.error(`未能找到年份: ${lastData.year}`);
      return { success: false };
    }
    years[yearIndex].click();
    console.log(`定位到年份: ${lastData.year}, 索引: ${yearIndex}`);
    await waitForNextList(years[yearIndex], 'combo-1061-picker-listEl');
  
    const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
    const makeIndex = makes.findIndex((make) => make.textContent.trim() === lastData.make);
    if (makeIndex === -1) {
      console.error(`未能找到品牌: ${lastData.make}`);
      return { success: false, yearIndex };
    }
    makes[makeIndex].click();
    console.log(`定位到品牌: ${lastData.make}, 索引: ${makeIndex}`);
    await waitForNextList(makes[makeIndex], 'combo-1062-picker-listEl');
  
    const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
    const modelIndex = models.findIndex((model) => model.textContent.trim() === lastData.model);
    if (modelIndex === -1) {
      console.error(`未能找到车型: ${lastData.model}`);
      return { success: false, yearIndex, makeIndex };
    }
    models[modelIndex].click();
    console.log(`定位到车型: ${lastData.model}, 索引: ${modelIndex}`);
    await waitForNextList(models[modelIndex], 'combo-1063-picker-listEl');
  
    const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
    const typeIndex = types.findIndex((type) => type.textContent.trim() === lastData.type);
    if (typeIndex === -1) {
      console.error(`未能找到部件类型: ${lastData.type}`);
      return { success: false, yearIndex, makeIndex, modelIndex };
    }
    types[typeIndex].click();
    console.log(`定位到部件类型: ${lastData.type}, 索引: ${typeIndex}`);
    await waitForNextList(types[typeIndex], 'combo-1064-picker-listEl');
  
    const engines = Array.from(document.querySelectorAll('#combo-1064-picker-listEl > *'));
    const engineIndex = engines.findIndex((engine) => engine.textContent.trim() === lastData.engine);
    if (engineIndex === -1) {
      console.error(`未能找到发动机: ${lastData.engine}`);
      return { success: false, yearIndex, makeIndex, modelIndex, typeIndex };
    }
    engines[engineIndex].click();
    console.log(`定位到发动机: ${lastData.engine}, 索引: ${engineIndex}`);
    return { success: true, yearIndex, makeIndex, modelIndex, typeIndex, engineIndex };
  };
  
  // 开始抓取任务
  const fetchAndLocate = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/parts/latest');
      if (response.ok) {
        const data = await response.json();
        const lastData = data.latestParts?.[0];
        if (lastData) {
          const locateResult = await locateLastPosition(lastData);
          if (locateResult.success) {
            console.log('定位成功，从上次记录继续抓取...');
            await continueCatching(locateResult);
            return;
          }
        }
      }
      console.error('未能获取到 lastData 或定位失败，重新从头开始...');
      catchData(); // 若无法定位则重新从头开始抓取
    } catch (error) {
      console.error('获取 lastData 时出错:', error);
      catchData(); // 若出错则重新从头开始抓取
    }
  };
  
  // 从头开始抓取的函数
  const catchData = async () => {
    const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *'));
    for (let year of years) {
      await waitForNextList(year, 'combo-1061-picker-listEl');
      const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
      for (let make of makes) {
        await waitForNextList(make, 'combo-1062-picker-listEl');
        const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
        for (let model of models) {
          await waitForNextList(model, 'combo-1063-picker-listEl');
          const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
          for (let type of types) {
            await waitForNextList(type, 'combo-1064-picker-listEl');
            const engines = Array.from(document.querySelectorAll('#combo-1064-picker-listEl > *'));
            for (let engine of engines) {
              engine.click();
              await new Promise((resolve) => setTimeout(resolve, 10000)); // 等待数据加载完成
              const yearText = year.textContent.trim();
              const makeText = make.textContent.trim();
              const modelText = model.textContent.trim();
              const typeText = type.textContent.trim();
              const engineText = engine.textContent.trim();
              console.log(`抓取数据: Year=${yearText}, Make=${makeText}, Model=${modelText}, Type=${typeText}, Engine=${engineText}`);
  
              // 等待并解析 XML 数据
              await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待请求完成
              const parser = new DOMParser();
              const result = parser.parseFromString(window.lastResult, 'text/xml');
  
              // 检查解析错误
              if (result.getElementsByTagName('parsererror').length > 0) {
                console.error('XML解析错误:', result.getElementsByTagName('parsererror')[0].textContent);
                continue;
              }
  
              const resultJson = xmlToJson(result.documentElement);
              if (result.documentElement.tagName === 'ShowMeThePartsDetail') {
                await makeFetchRequest(resultJson, yearText, makeText, modelText, typeText, engineText);
              }
            }
          }
        }
      }
    }
  };
  
  // 启动任务
  fetchAndLocate();