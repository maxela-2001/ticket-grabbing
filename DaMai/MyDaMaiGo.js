// 检查无障碍服务是否已经启用
// 如果没有启用则跳转到无障碍服务启用界面 并等待无障碍服务启动
// 当无障碍服务启动后脚本会继续运行
auto.waitFor();
app.launchApp("大麦"); // Open DaMai
openConsole();
console.setTitle("大麦GO!!!!!", "#ff11ee00", 30);

main();


/**
 * @returns {boolean} 是否处于详情界面
 */
function getIsDetailPage() {
  return (
    textContains("人想看").findOnce() !== null &&
    textContains("座位图").findOnce() !== null
  );
}

/**
 * @returns {boolean} 是否处于倒计时界面
 */
function getIsCountdown() {
  return (
    textContains("仅").findOnce() !== null &&
    textContains("时").findOnce() !== null &&
    textContains("分").findOnce() !== null &&
    textContains("秒").findOnce() !== null
  );
}

function main() {}


/**
* 
* @returns 大麦服务器时间戳
*/
function getDamaiTimestamp() {
  return JSON.parse(http.get("https://mtop.damai.cn/gw/mtop.common.getTimestamp/", {
      headers: {
          'Host': 'mtop.damai.cn',
          'Content-Type': 'application/json;charset=utf-8',
          'Accept': '*/*',
          'User-Agent': 'floattime/1.1.1 (iPhone; iOS 15.6; Scale/3.00)',
          'Accept-Language': 'zh-Hans-CN;q=1, en-CN;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive'
      }
  }).body.string()).data.t;
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
function coordClick(widget, delay = 1) {
  return press(widget.bounds().centerX(), widget.bounds().centerY(), delay);
}