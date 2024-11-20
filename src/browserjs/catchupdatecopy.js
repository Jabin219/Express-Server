// can locate and recursion but not add correctly!

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
  
  const waitForNextList = (element, nextId) => {
    const targetNode = document.getElementById(nextId);
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
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
  
  const makeFetchRequest = async (resultJson, year, make, model, type, engine) => {
    const postData = {
      resultJson,
      year,
      make,
      model,
      type,
      engine,
    };
  
    console.log("准备发送以下数据到后端:", postData); // 添加日志记录发送的数据
  
    try {
      const response = await fetch("http://localhost:8081/api/parts/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
  
      // 同时打印插入条数和完整的返回数据
      console.log(`插入了 ${data.insertCount || 0} 条记录，返回数据:`, data);
  
      // 如果需要可以单独打印额外信息
      if (data.error) {
        console.error("后端返回错误信息:", data.error);
      }
      if (data.warnings) {
        console.warn("后端返回警告信息:", data.warnings);
      }
  
      return data; // 保留返回值以供调用方使用
    } catch (error) {
      console.error("提交数据到后端失败:", error);
  
      // 添加重试逻辑或更多调试信息
      console.log("尝试重新发送请求...");
      await makeFetchRequest(resultJson, year, make, model, type, engine);
    }
  };
  
  const continueCatching = async (lastIndices) => {
    console.log("继续从定位位置抓取...");
    const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *')).slice(lastIndices.yearIndex);
    for (let year of years) {
      await waitForNextList(year, "combo-1061-picker-listEl");
      const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
      for (let make of makes.slice(lastIndices.makeIndex || 0)) {
        await waitForNextList(make, "combo-1062-picker-listEl");
        const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
        for (let model of models.slice(lastIndices.modelIndex || 0)) {
          await waitForNextList(model, "combo-1063-picker-listEl");
          const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
          for (let type of types.slice(lastIndices.typeIndex || 0)) {
            await waitForNextList(type, "combo-1064-picker-listEl");
            const engines = Array.from(document.querySelectorAll('#combo-1064-picker-listEl > *'));
            for (let engine of engines.slice(lastIndices.engineIndex || 0)) {
              engine.click();
              await new Promise((resolve) => setTimeout(resolve, 10000)); // 增加10秒等待时间，确保数据加载完成
              const yearText = year.textContent.trim();
              const makeText = make.textContent.trim();
              const modelText = model.textContent.trim();
              const typeText = type.textContent.trim();
              const engineText = engine.textContent.trim();
              console.log(`抓取数据: Year=${yearText}, Make=${makeText}, Model=${modelText}, Type=${typeText}, Engine=${engineText}`);
              const parser = new DOMParser();
              const result = parser.parseFromString(window.lastResult, "text/xml");
              const resultJson = xmlToJson(result.documentElement);
              await makeFetchRequest(resultJson, yearText, makeText, modelText, typeText, engineText);
            }
            lastIndices.engineIndex = 0; // 重置发动机索引
          }
          lastIndices.typeIndex = 0; // 重置部件类型索引
        }
        lastIndices.modelIndex = 0; // 重置车型索引
      }
      lastIndices.makeIndex = 0; // 重置品牌索引
    }
  };
  
  const fetchAndLocate = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/parts/latest");
      if (response.ok) {
        const data = await response.json();
        const lastData = data.latestParts?.[0];
        if (lastData) {
          const locateResult = await locateLastPosition(lastData);
          if (locateResult.success) {
            console.log("定位成功，从上次记录继续抓取...");
            await continueCatching(locateResult);
            return;
          }
        }
      }
      console.error("未能获取到 lastData 或定位失败，重新从头开始...");
      catchData(); // 若无法定位则重新从头开始抓取
    } catch (error) {
      console.error("获取 lastData 时出错:", error);
      catchData(); // 若出错则重新从头开始抓取
    }
  };
  
  const locateLastPosition = async (lastData) => {
    console.log("定位到上次抓取的位置:", lastData);
  
    const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *'));
    const yearIndex = years.findIndex((year) => year.textContent.trim() === lastData.year);
    if (yearIndex === -1) {
      console.error(`未能找到年份: ${lastData.year}`);
      return { success: false };
    }
    years[yearIndex].click();
    console.log(`定位到年份: ${lastData.year}, 索引: ${yearIndex}`);
    await waitForNextList(years[yearIndex], "combo-1061-picker-listEl");
  
    const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
    const makeIndex = makes.findIndex((make) => make.textContent.trim() === lastData.make);
    if (makeIndex === -1) {
      console.error(`未能找到品牌: ${lastData.make}`);
      return { success: false, yearIndex };
    }
    makes[makeIndex].click();
    console.log(`定位到品牌: ${lastData.make}, 索引: ${makeIndex}`);
    await waitForNextList(makes[makeIndex], "combo-1062-picker-listEl");
  
    const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
    const modelIndex = models.findIndex((model) => model.textContent.trim() === lastData.model);
    if (modelIndex === -1) {
      console.error(`未能找到车型: ${lastData.model}`);
      return { success: false, yearIndex, makeIndex };
    }
    models[modelIndex].click();
    console.log(`定位到车型: ${lastData.model}, 索引: ${modelIndex}`);
    await waitForNextList(models[modelIndex], "combo-1063-picker-listEl");
  
    const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
    const typeIndex = types.findIndex((type) => type.textContent.trim() === lastData.type);
    if (typeIndex === -1) {
      console.error(`未能找到部件类型: ${lastData.type}`);
      return { success: false, yearIndex, makeIndex, modelIndex };
    }
    types[typeIndex].click();
    console.log(`定位到部件类型: ${lastData.type}, 索引: ${typeIndex}`);
    await waitForNextList(types[typeIndex], "combo-1064-picker-listEl");
  
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
  fetchAndLocate();