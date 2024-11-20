const xmlToJson = (xml) => {
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
  
  const waitForNextList = (element, nextId) => {
    const targetNode = document.getElementById(nextId);
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            observer.disconnect();
            setTimeout(resolve, 1000);
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
      }, 5000);
    });
  };
  
  const locateLastPosition = async (lastData) => {
    console.log("定位到上次抓取的位置:", lastData);
  
    // 定位年份 (Year)
    const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *'));
    const yearIndex = years.findIndex((year) => year.textContent.trim() === lastData.year);
    if (yearIndex === -1) {
      console.error(`未能找到年份: ${lastData.year}`);
      return false;
    }
    years[yearIndex].click();
    console.log(`定位到年份: ${lastData.year}, 索引: ${yearIndex}`);
    await waitForNextList(years[yearIndex], "combo-1061-picker-listEl");
  
    // 定位品牌 (Make)
    const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
    const makeIndex = makes.findIndex((make) => make.textContent.trim() === lastData.make);
    if (makeIndex === -1) {
      console.error(`未能找到品牌: ${lastData.make}`);
      return false;
    }
    makes[makeIndex].click();
    console.log(`定位到品牌: ${lastData.make}, 索引: ${makeIndex}`);
    await waitForNextList(makes[makeIndex], "combo-1062-picker-listEl");
  
    // 定位车型 (Model)
    const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
    const modelIndex = models.findIndex((model) => model.textContent.trim() === lastData.model);
    if (modelIndex === -1) {
      console.error(`未能找到车型: ${lastData.model}`);
      return false;
    }
    models[modelIndex].click();
    console.log(`定位到车型: ${lastData.model}, 索引: ${modelIndex}`);
    await waitForNextList(models[modelIndex], "combo-1063-picker-listEl");
  
    // 定位部件类型 (Type)
    const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
    const typeIndex = types.findIndex((type) => type.textContent.trim() === lastData.type);
    if (typeIndex === -1) {
      console.error(`未能找到部件类型: ${lastData.type}`);
      return false;
    }
    types[typeIndex].click();
    console.log(`定位到部件类型: ${lastData.type}, 索引: ${typeIndex}`);
    await waitForNextList(types[typeIndex], "combo-1064-picker-listEl");
  
    // 定位发动机 (Engine)
    const engines = Array.from(document.querySelectorAll('#combo-1064-picker-listEl > *'));
    const engineIndex = engines.findIndex((engine) => engine.textContent.trim() === lastData.engine);
    if (engineIndex === -1) {
      console.error(`未能找到发动机: ${lastData.engine}`);
      return false;
    }
    engines[engineIndex].click();
    console.log(`定位到发动机: ${lastData.engine}, 索引: ${engineIndex}`);
    return true;
  };
  
  const fetchAndLocate = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/parts/latest");
      if (response.ok) {
        const data = await response.json();
        const lastData = data.latestParts?.[0];
        if (lastData) {
          const success = await locateLastPosition(lastData);
          if (success) {
            console.log("定位成功，从上次记录继续抓取...");
            await continueCatching(); // 定位成功后继续抓取
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
  
  const continueCatching = async () => {
    console.log("继续抓取...");
    // 添加您的继续抓取逻辑，这部分可以基于 locateLastPosition 的结果继续进行
  };
  
  const catchData = async () => {
    console.log("从头开始抓取...");
    const years = Array.from(document.querySelectorAll('#combo-1060-picker-listEl > *'));
    for (let year of years) {
      await waitForNextList(year, "combo-1061-picker-listEl");
      const makes = Array.from(document.querySelectorAll('#combo-1061-picker-listEl > *'));
      for (let make of makes) {
        await waitForNextList(make, "combo-1062-picker-listEl");
        const models = Array.from(document.querySelectorAll('#combo-1062-picker-listEl > *'));
        for (let model of models) {
          await waitForNextList(model, "combo-1063-picker-listEl");
          const types = Array.from(document.querySelectorAll('#combo-1063-picker-listEl > *'));
          for (let type of types) {
            await waitForNextList(type, "combo-1064-picker-listEl");
            const engines = Array.from(document.querySelectorAll('#combo-1064-picker-listEl > *'));
            for (let engine of engines) {
              engine.click();
              await new Promise((resolve) => setTimeout(resolve, 8000)); // 等待数据加载
            }
          }
        }
      }
    }
  };
  
  // 开始抓取数据
  fetchAndLocate();