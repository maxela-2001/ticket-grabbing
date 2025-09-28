// 检查无障碍服务是否已经启用
// 如果没有启用则跳转到无障碍服务启用界面 并等待无障碍服务启动
// 当无障碍服务启动后脚本会继续运行
auto.waitFor();
app.launchApp("大麦"); // Open DaMai
openConsole();
console.setTitle("大麦GO!!!!!", "#ff11ee00", 30);

const ISDEBUG = true;
const SPAM = true;
// if (ISDEBUG) {
//   threads.start(debugOutputThread());
//   console.log("【调试】已打开调试输出");
// }

main();

function main() {
  // check prebook
  var preBook = true;

  //
  var confirmX;
  var confirmY;

  // 计算向大麦发起HTTP后对应的大麦时间戳并实时更新，进而提前点击
  // 例如：我在t时发起HTTP，返回了大麦时间戳t+dt，那么时间戳偏移就是dt
  // 如果s时开抢，并且s-dt时按钮未启用，脚本会尝试提前点击
  // 下面的rttavg就是最近15次测速的中位数
  var dts = [];
  var dt_med;
  var pause = false; //是否中止估算偏移，节省资源
  var deadline;

  threads.start(function () {
    console.log("开始估算大麦服务器时间偏移");
    let i = 0;
    while (true) {
      if (pause) {
        if (ISDEBUG) {
          console.log("暂停记录时间偏移");
        }
        while (pause) {
          sleep(200);
        }
        if (ISDEBUG) {
          console.log("继续记录时间偏移");
        }
      }
      let clientTs_before = Date.now();
      let serverTs = getDamaiTimestamp();
      let dt = serverTs - clientTs_before;
      if (ISDEBUG) {
        console.log("本次记录时间偏移：" + dt + "ms");
      }
      dts.push(dt);
      if (dts.length > 15) {
        dts = dts.slice(-15);
      }
      dt_med = Math.round(softMedian(dts));
      if (!i) {
        console.log("已更新时间偏移：" + dt_med + "ms");
      }
      sleep(500); // 避免请求太快
      i = (i + 1) % 5;
    }
  });

  // 当前界面 貌似没啥用
  var isDetailPage;
  var isCountdown;
  var isConfirmBuy;
  threads.start(function () {
    while (true) {
      if (!pause) {
        isDetailPage = getIsDetailPage();
        isCountdown = getIsCountdown();
        isConfirmBuy = getIsConfirmBuy();
        sleep(250);
      }
    }
  });

  while (true) {
    // 详情界面逻辑
    if (getIsDetailPage()) {
      let buyNowBtn = idContains(
        "project_detail_purchase_status_bar_container"
      ).findOnce();
      confirmX = (buyNowBtn.bounds().centerX() + buyNowBtn.bounds().right) / 2;
      confirmY = buyNowBtn.bounds().centerY();
      // 准备开抢吗
      if (getIsCountdown()) {
        deadline = parseDeadlineText(
          textMatches(".*月.*日.*开抢").findOnce().text()
        );
        console.log("已获得开抢时间：" + new Date(deadline));
        if (ISDEBUG) {
          console.log("调试模式休息5秒");
          sleep(5000);
        }
        if (!ISDEBUG) {
          console.log("将于开抢前5秒运行，请确保观演人信息已填写！");
          while (deadline - Date.now() > 6000) {
            sleep(1000);
          }
        }

        pause = true;
        let dt_final = dt_med;
        console.log("还剩5秒，最终延迟为：" + dt_final);
        let clickTime = deadline - dt_final;

        // 阶段1：粗等
        while (Date.now() < clickTime - 1000 && getIsCountdown()) {
          let remain = clickTime - Date.now() - 1000;
          sleep(250);
        }

        // 阶段2：精等
        console.log("准备……" + dt_final);
        while (Date.now() < clickTime && getIsCountdown()) {}

        console.log("冲刺！！冲刺！！冲！冲！" + dt_final);
        while (true) {
          press(confirmX, confirmY, 1);
          sleep(50);
        }
      }
    }
    sleep(250);
  }
}

// 页面判断进程
function debugOutputThread() {
  while (true) {
    console.log("---");
    console.log("【调试】详情页面：" + getIsDetailPage());
    console.log("【调试】倒计时页面：" + getIsCountdown());
    console.log("【调试】选票页面：" + getIsSelectTier());
    sleep(2000);
  }
}

/**
 * @returns {boolean} 是否处于详情界面
 */
function getIsDetailPage() {
  return (
    // textContains("人想看").exists() &&
    // textContains("座位图").exists()
    idContains("project_item_bottom_customer_service").exists()
    // 寻找底部“帮助”按钮
  );
}

/**
 * @returns {boolean} 是否处于倒计时界面
 */
function getIsCountdown() {
  return (
    textContains("仅").exists() &&
    textContains("时").exists() &&
    textContains("分").exists() &&
    textContains("秒").exists()
  );
}

function getIsSelectSession() {
  return textContains("场次").exists();
}

function getIsSelectTier() {
  return getIsSelectSession && textContains("票档").exists();
}

function getIsConfirmBuy() {
  return textContains("确认购买").findOnce !== null;
}

/**
 * 获取服务器与本地的时间差 (ms)，去掉最大最小后取平均
 * @param {number} n 采样次数 (默认 5)
 * @returns {number} 平均差值 (ms)
 */
function getServerClientDelayAvg(n) {
  let n = n || 5;
  let arr = [];
  for (let i = 0; i < n; i++) {
    let clientTs_before = Date.now();
    let serverTs = getDamaiTimestamp();
    let clientTs_after = Date.now();
    let clientTs_avg = (clientTs_before + clientTs_after) / 2;
    arr.push(serverTs - clientTs_avg);
    sleep(1000); // 避免请求太快
  }
  arr.sort((a, b) => a - b);
  if (arr.length > 2) {
    arr = arr.slice(0, -1); // 去掉最大最小
  }
  let sum = arr.reduce((x, y) => x + y, 0);
  return Math.round(sum / arr.length);
}

/**
 *
 * @returns 大麦服务器时间戳
 */
function getDamaiTimestamp() {
  return JSON.parse(
    http
      .get("https://mtop.damai.cn/gw/mtop.common.getTimestamp/", {
        headers: {
          Host: "mtop.damai.cn",
          "Content-Type": "application/json;charset=utf-8",
          Accept: "*/*",
          "User-Agent": "floattime/1.1.1 (iPhone; iOS 15.6; Scale/3.00)",
          "Accept-Language": "zh-Hans-CN;q=1, en-CN;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
        },
      })
      .body.string()
  ).data.t;
}

function parseDeadlineText(str) {
  let re = /(\d+)月(\d+)日\s*(\d+):(\d+)开抢/;
  let m = str.match(re);
  if (!m) return null;

  let month = parseInt(m[1], 10);
  let day = parseInt(m[2], 10);
  let hour = parseInt(m[3], 10);
  let min = parseInt(m[4], 10);
  let year = new Date().getFullYear();

  // 拼接成 "YYYY-MM-DDTHH:mm:00+08:00"
  let iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+08:00`;

  // 交给 Date 解析
  return new Date(iso).getTime();
}

/**
 *
 * @param {时间戳} timestamp
 * @returns ISO 8601 格式的北京时间
 */
function convertToTime(timestamp) {
  var date = new Date(Number(timestamp));
  var year = date.getUTCFullYear();
  var month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  var day = date.getUTCDate().toString().padStart(2, "0");
  var hours = (date.getUTCHours() + 8).toString().padStart(2, "0");
  var minutes = date.getUTCMinutes().toString().padStart(2, "0");
  var seconds = date.getUTCSeconds().toString().padStart(2, "0");
  var milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");
  var iso8601 = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  return iso8601;
}

/**
 * 点击控件的中点坐标
 * @param {UIObject} widget
 * @param {number} delay
 * @returns
 */
function coordClick(widget, delay) {
  let delay = delay || 1;
  return press(widget.bounds().centerX(), widget.bounds().centerY(), delay);
}

/**
 * 返回数组中位数
 * @param {*} arr
 * @returns
 */
function softMedian(arr) {
  if (arr.length === 0) return 0;
  let sorted = arr.slice().sort(function (a, b) {
    return a - b;
  });
  let n = sorted.length;
  let mid = Math.floor(n / 2);

  if (n % 2 === 1) {
    // odd → average 3 values around middle if possible
    if (n >= 3) {
      return (sorted[mid - 1] + sorted[mid] + sorted[mid + 1]) / 3;
    } else {
      return sorted[mid];
    }
  } else {
    // even → average 2 middle values
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
