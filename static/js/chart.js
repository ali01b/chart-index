let chart;
let rsiChart; // Chart global değişkeni

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Veri alınırken hata oluştu");
    return await response.json();
  } catch (error) {
    console.error("API hatası:", error);
    return null;
  }
}

function calculateMovingAverageSeriesData(candleData, maLength) {
  const maData = [];

  for (let i = 0; i < candleData.length; i++) {
    if (i < maLength) {
      // Provide whitespace data points until the MA can be calculated
      maData.push({ time: candleData[i].time });
    } else {
      // Calculate the moving average, slow but simple way
      let sum = 0;
      for (let j = 0; j < maLength; j++) {
        sum += candleData[i - j].close;
      }
      const maValue = sum / maLength;
      maData.push({ time: candleData[i].time, value: maValue });
    }
  }

  return maData;
}

async function initMainChart(stockData) {
  const chartOptions = {
    layout: {
      background: { color: "#000000" },
      textColor: "#CCCCCC",
    },
    width: window.innerWidth,
    height: window.innerHeight,
    grid: {
      visible: false,
      vertLines: { color: "#000000" },
      horzLines: { color: "#000000" },
    },
    timeScale: {
      timeVisible: true,
      borderColor: "#555555",
    },
    priceScale: {
      borderColor: "#555555",
    },
    crosshair: {
      mode: 0, // CrosshairMode.Normal
    },
    width: document.getElementById("chart").clientWidth,
    height: document.getElementById("chart").clientHeight,
  };

  chart = LightweightCharts.createChart(
    document.getElementById("chart"),
    chartOptions
  );

  const candleSeries = chart.addCandlestickSeries({
    upColor: "#089981",
    downColor: "#f23645",
    borderDownColor: "#f23645",
    borderUpColor: "#089981",
    wickDownColor: "#f23645",
    wickUpColor: "#089981",
  });

  candleSeries.setData(
    stockData.historical_data.map((x) => ({
      time: x.time,
      open: x.open,
      high: x.high,
      low: x.low,
      close: x.close,
    }))
  );

  const maData = calculateMovingAverageSeriesData(
    stockData.historical_data.map((x) => ({
      time: x.time,
      open: x.open,
      high: x.high,
      low: x.low,
      close: x.close,
    })),
    20
  );

  const maSeries = chart.addLineSeries({ color: "#2962FF", lineWidth: 1 });
  maSeries.setData(maData);

  const baData = calculateMovingAverageSeriesData(
    stockData.historical_data.map((x) => ({
      time: x.time,
      open: x.open,
    })),
    20
  );

  const baSeries = chart.addLineSeries({ color: "red", lineWidth: 1 });
  baSeries.setData(baData);

  const volumeSeries = chart.addHistogramSeries({
    color: "rgba(255, 179, 0, 0.41)",
    priceFormat: {
      type: "volume",
    },
    priceScaleId: "", // set as an overlay by setting a blank priceScaleId
    // set the positioning of the volume series
    scaleMargins: {
      top: 0.7, // highest point of the series will be 70% away from the top
      bottom: 0,
    },
  });
  volumeSeries.priceScale().applyOptions({
    scaleMargins: {
      top: 0.9, // highest point of the series will be 70% away from the top
      bottom: 0,
    },
  });

  // const extraSeries = chart.addAreaSeries({
  //   topColor: "rgba(243, 251, 0, 0.78)",
  //   bottomColor: "rgba(245, 253, 0, 0.2)",
  //   lineColor: "rgba(243, 251, 0, 0.59)",
  //   lineWidth: 2,
  // });
  // extraSeries.priceScale().applyOptions({
  //   scaleMargins: {
  //     top: 0.1,
  //     bottom: 0.4,
  //   },
  // });

  // extraSeries.setData(
  //   stockData.historical_data.map((x) => ({
  //     time: x.time,
  //     value: x.low,
  //   }))
  // );

  // areaSeries.setData(
  //   stockData.historical_data.map((x) => ({
  //     time: x.time,
  //     value: x.low,
  //   }))
  // );

  volumeSeries.setData(
    stockData.historical_data.map((x) => ({
      time: x.time,
      value: x.open,
    }))
  );

  const supportLevels = stockData.levels.supports; // Destek seviyeleri dizisi
  const resistanceLevels = stockData.levels.resistances; // Direnç seviyeleri dizisi

  // Destek seviyelerini çizen döngü
  supportLevels.forEach((support) => {
    const supportLine = chart.addLineSeries({
      color: "red",
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted,
    });

    supportLine.setData(
      stockData.historical_data.map((x) => ({
        time: x.time,
        value: support, // Her bir destek seviyesi için veri
      }))
    );
  });

  // Direnç seviyelerini çizen döngü
  resistanceLevels.forEach((resistance) => {
    const resistanceLine = chart.addLineSeries({
      color: "green",
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted,
    });

    resistanceLine.setData(
      stockData.historical_data.map((x) => ({
        time: x.time,
        value: resistance, // Her bir direnç seviyesi için veri
      }))
    );
  });

  // const support = stockData.levels.supports;
  // const resistance = stockData.levels.resistances;

  // const resistanceLine = chart.addLineSeries({
  //   color: "green",
  //   lineWidth: 1,
  //   lineStyle: LightweightCharts.LineStyle.Dotted,
  // });

  // const supportLine = chart.addLineSeries({
  //   color: "red",
  //   lineWidth: 1,
  //   lineStyle: LightweightCharts.LineStyle.Dotted,
  // });

  // supportLine.setData(
  //   stockData.historical_data.map((x) => ({
  //     time: x.time,
  //     value: support,
  //   }))
  // );

  // resistanceLine.setData(
  //   stockData.historical_data.map((x) => ({
  //     time: x.time,
  //     value: resistance,
  //   }))
  // );

  chart.timeScale().setVisibleLogicalRange({ from: 350, to: 500 });
}

async function initRSIChart(stockData) {
  const rsiOptions = {
    layout: {
      background: { color: "#000000" },
      textColor: "#CCCCCC",
    },
    width: document.getElementById("chart").clientWidth,
    height: document.getElementById("rsiChart").clientHeight,
    grid: {
      visible: false,
      vertLines: { color: "#000000" },
      horzLines: { color: "#000000" },
    },
    timeScale: {
      borderColor: "rgba(197, 203, 206, 0.8)",
      timeVisible: true,
      secondsVisible: false,
      rightBarStaysOnScroll: true,
    },
    priceScale: {
      borderColor: "#555555",
    },
  };

  rsiChart = LightweightCharts.createChart(
    document.getElementById("rsiChart"),
    rsiOptions
  );

  const rsiSeries = rsiChart.addLineSeries({
    color: "#4e3a79",
    lineWidth: 2,
  });

  rsiSeries.setData(
    stockData.rsi.map((x) => ({
      time: x.time,
      value: x.rsi,
    }))
  );

  // Opsiyonel: RSI için 70 ve 30 referans çizgileri ekle
  const overboughtLine = rsiChart.addLineSeries({
    color: "green",
  });

  overboughtLine.setData(
    stockData.rsi.map((x) => ({
      time: x.time,
      value: 70,
    }))
  );

  const oversoldLine = rsiChart.addLineSeries({
    color: "blue",
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dotted,
  });

  oversoldLine.setData(
    stockData.rsi.map((x) => ({
      time: x.time,
      value: 30,
    }))
  );

  rsiChart.timeScale().applyOptions({ visible: false });
}

async function main() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const stockData = await fetchData(
    "https://python-rest-api-5q3k.onrender.com/api/stock/" +
      urlParams.get("ticker")
  );

  if (!stockData || stockData.error) {
    console.error("API'den gelen hata:", stockData?.error);
    return;
  }

  const watermarkElement = document.getElementById("watermark");
  watermarkElement.textContent =
    urlParams.get("ticker").replace(".IS", "") + " - BIST100";

  initMainChart(stockData);
  initRSIChart(stockData);
}

main();
