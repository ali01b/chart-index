let chart;
let rsiChart;

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

function calculateMovingAverageSeriesData(candleData, period) {
  const maData = [];

  for (let i = 0; i < candleData.length; i++) {
    if (i < period - 1) {
      maData.push({ time: candleData[i].time });
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candleData[i - j].close;
      }
      maData.push({
        time: candleData[i].time,
        value: sum / period,
      });
    }
  }

  return maData;
}

async function initMainChart(stockData) {
  const chartOptions = {
    layout: {
      background: {
        type: "gradient",
        gradient: {
          startColor: "#1a1d1f",
          endColor: "#131722",
        },
      },
      textColor: "#d1d4dc",
      fontSize: 12,
      fontFamily: "'Roboto', sans-serif",
    },
    grid: {
      vertLines: {
        color: "rgba(42, 46, 57, 0.5)",
        style: 1,
        visible: true,
      },
      horzLines: {
        color: "rgba(42, 46, 57, 0.5)",
        style: 1,
        visible: true,
      },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: {
        color: "rgba(224, 227, 235, 0.4)",
        width: 1,
        style: 0,
        labelBackgroundColor: "#2962FF",
      },
      horzLine: {
        color: "rgba(224, 227, 235, 0.4)",
        width: 1,
        style: 0,
        labelBackgroundColor: "#2962FF",
      },
    },
    timeScale: {
      borderColor: "rgba(42, 46, 57, 0.5)",
      timeVisible: true,
      secondsVisible: false,
      borderVisible: true,
    },
    rightPriceScale: {
      borderColor: "rgba(42, 46, 57, 0.5)",
      scaleMargins: {
        top: 0.1,
        bottom: 0.2,
      },
    },
    width: document.getElementById("chart").clientWidth,
    height: document.getElementById("chart").clientHeight,
  };

  let chart = LightweightCharts.createChart(
    document.getElementById("chart"),
    chartOptions
  );

  // Mum serisi
  const candleSeries = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderUpColor: "#26a69a",
    borderDownColor: "#ef5350",
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
    priceFormat: {
      type: "price",
      precision: 2,
      minMove: 0.01,
    },
  });

  // Volume serisi
  const volumeSeries = chart.addHistogramSeries({
    priceFormat: {
      type: "volume",
    },
    priceScaleId: "", // set as an overlay by setting a blank priceScaleId
    // set the positioning of the volume series
    scaleMargins: {
      top: 0.6, // highest point of the series will be 70% away from the top
      bottom: 0,
    },
  });

  volumeSeries.priceScale().applyOptions({
    scaleMargins: {
      top: 0.7, // highest point of the series will be 70% away from the top
      bottom: 0,
    },
  });

  // MA serileri
  const ma20Series = chart.addLineSeries({
    color: "#2962FF",
    lineWidth: 2,
    title: "MA20",
  });

  const ma50Series = chart.addLineSeries({
    color: "#FF6B6B",
    lineWidth: 2,
    title: "MA50",
  });

  // Veri hazırlama
  const historicalData = stockData.historical_data.map((x) => ({
    time: x.date,
    open: x.open,
    high: x.high,
    low: x.low,
    close: x.close,
  }));

  // Volume verilerini renklendirme
  const volumeData = stockData.historical_data.map((x, index) => ({
    time: x.date,
    value: x.volume,
    color:
      x.close >= x.open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
  }));

  // MA verilerini hesaplama
  const ma20Data = calculateMovingAverageSeriesData(historicalData, 20);
  const ma50Data = calculateMovingAverageSeriesData(historicalData, 50);

  // Destek ve direnç seviyeleri
  stockData.supports.forEach((support) => {
    const supportLine = chart.addLineSeries({
      color: "rgba(38, 166, 154, 0.6)",
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      title: "Destek",
    });

    supportLine.setData(
      historicalData.map((x) => ({
        time: x.time,
        value: support,
      }))
    );
  });

  stockData.resistances.forEach((resistance) => {
    const resistanceLine = chart.addLineSeries({
      color: "rgba(239, 83, 80, 0.6)",
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      title: "Direnç",
    });

    resistanceLine.setData(
      historicalData.map((x) => ({
        time: x.time,
        value: resistance,
      }))
    );
  });

  // Verileri set etme
  candleSeries.setData(historicalData);
  volumeSeries.setData(volumeData);
  ma20Series.setData(ma20Data);
  ma50Series.setData(ma50Data);

  // Son 50 muma zoom
  const lastNCandles = 150; // İstediğiniz sayıya ayarlayabilirsiniz
  if (historicalData.length > lastNCandles) {
    chart.timeScale().setVisibleLogicalRange({
      from: historicalData.length - lastNCandles,
      to: historicalData.length - 1,
    });
  } else {
    chart.timeScale().fitContent();
  }
  chart.timeScale().applyOptions({ visible: false });
  window.addEventListener("resize", () => {
    chart.applyOptions({
      width: document.getElementById("chart").clientWidth,
    });
  });
}

async function initRSIChart(stockData) {
  const rsiOptions = {
    layout: {
      background: {
        type: "gradient",
        gradient: {
          startColor: "#1a1d1f",
          endColor: "#131722",
        },
      },
      textColor: "#d1d4dc",
      fontSize: 12,
      fontFamily: "'Roboto', sans-serif",
    },
    grid: {
      vertLines: {
        color: "rgba(42, 46, 57, 0.5)",
      },
      horzLines: {
        color: "rgba(42, 46, 57, 0.5)",
      },
    },
    timeScale: {
      borderColor: "rgba(42, 46, 57, 0.5)",
      timeVisible: true,
    },
    rightPriceScale: {
      borderColor: "rgba(42, 46, 57, 0.5)",
    },
    width: document.getElementById("rsiChart").clientWidth,
    height: document.getElementById("rsiChart").clientHeight,
  };

  let rsiChart = LightweightCharts.createChart(
    document.getElementById("rsiChart"),
    rsiOptions
  );

  // RSI serisi
  const rsiSeries = rsiChart.addLineSeries({
    color: "#7C83FD",
    lineWidth: 2,
    title: "RSI",
  });

  // Aşırı alım/satım seviyeleri
  const overboughtLine = rsiChart.addLineSeries({
    color: "rgba(239, 83, 80, 0.6)",
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    title: "Aşırı Alım",
  });

  const oversoldLine = rsiChart.addLineSeries({
    color: "rgba(38, 166, 154, 0.6)",
    lineWidth: 1,
    lineStyle: LightweightCharts.LineStyle.Dashed,
    title: "Aşırı Satım",
  });

  // Verileri set etme
  rsiSeries.setData(
    stockData.historical_data.map((x) => ({
      time: x.date,
      value: x.rsi,
    }))
  );

  overboughtLine.setData(
    stockData.historical_data.map((x) => ({
      time: x.date,
      value: 70,
    }))
  );

  oversoldLine.setData(
    stockData.historical_data.map((x) => ({
      time: x.date,
      value: 30,
    }))
  );

  // Responsive davranış
  window.addEventListener("resize", () => {
    rsiChart.applyOptions({
      width: document.getElementById("rsiChart").clientWidth,
    });
  });
  rsiChart.timeScale().fitContent();
}

async function main() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const stockData = await fetchData(
    "https://borsa-api.onrender.com/stock/" +
      urlParams.get("ticker") +
      ".IS"
  );

  if (!stockData || stockData.error) {
    console.error("API'den gelen hata:", stockData?.error);
    return;
  }

  const watermarkElement = document.getElementById("watermark");
  watermarkElement.textContent =
    urlParams.get("ticker").replace(".IS", "") + ", 4s";

  document.getElementById("watermark-hero").textContent = "@erolatasoy chart";

  await initMainChart(stockData);
  await initRSIChart(stockData);
}

main();
