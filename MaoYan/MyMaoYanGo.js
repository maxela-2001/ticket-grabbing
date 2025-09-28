// 检查无障碍服务是否已经启用，如果没有启用则跳转到无障碍服务启用界面，并等待无障碍服务启动；当无障碍服务启动后脚本会继续运行。
auto.waitFor();
//打开猫眼app
app.launchApp("猫眼");
openConsole();
console.setTitle("猫眼 go!", "#ff11ee00", 30);

//确认选票坐标，建议配置（不配置时仍会寻找“确认”按钮进行点击，但可能会出现点击失败的情况）
const ConfirmX = 878;
const ConfirmY = 2263;

//是否在测试调试
var ISDEBUG = true;
//调试模式下的模拟票档自动选择的点击坐标
var debugTicketClickX = 207;
var debugTicketClickY = 1170;

main();

function main() {
  console.log("开始猫眼抢票主程序");
  textContains("猫眼演出详情").waitFor();

  var preBook = text("已 预 约").findOne(2000);
  var preBook2 = className("android.widget.TextView")
    .text("已填写")
    .findOne(2000);

  var isPreBook = preBook2 != null || preBook != null;
  console.log("界面是否已预约：" + isPreBook);

  if (!isPreBook && !ISDEBUG) {
    console.log(
      "无预约信息，请提前填写抢票信息!（若已经开票，请到票档界面使用MoYanMonitor.js）"
    );
    return;
  }

  //出现刷新按钮时点击刷新
  threads.start(function () {
    log("刷新按钮自动点击线程已启动");
    while (true) {
      textContains("刷新").waitFor();
      textContains("刷新").findOne().click();
      //   log("点击刷新...");
      //避免点击过快
      sleep(100);
    }
  });

  console.log("等待开抢...");
  while (true) {
    var but1 = classNameStartsWith("android.widget.").text("立即预订").exists();
    var but2 = classNameStartsWith("android.widget.").text("立即购票").exists();
    var but3 = classNameStartsWith("android.widget.").text("特惠购票").exists();
    //var but4= classNameStartsWith('android.widget.').text("缺货登记").exists();
    var result = but1 || but2 || but3;
    if (result) {
      var s;
      if (but1) {
        s = classNameStartsWith("android.widget.")
          .text("立即预订")
          .findOne()
          .click();
      } else if (but2) {
        s = classNameStartsWith("android.widget.")
          .text("立即购票")
          .findOne()
          .click();
      } else if (but3) {
        s = classNameStartsWith("android.widget.")
          .text("特惠购票")
          .findOne()
          .click();
      }
      break;
    }
  }

  //猛点，一直点到出现支付按钮为止
  console.log("① 准备确认购票");
  for (let cnt = 0; cnt >= 0; cnt) {
    if (ISDEBUG && textContains("请选择").exists()) {
      //调试模式，模拟选择票档，模拟已预约后自动选择票档
      let pd = textContains("¥").textMatches(/^.*(?!.*缺货登记).*$/).findOne().click();
      //   click(pd.bounds().centerX(), pd.bounds().centerX());
    }
    //绝对坐标点击
    // press(ConfirmX, ConfirmY, 25);
    //文字查找按钮点击，避免未正确配置坐标导致的点击失败
    if (text("确认").exists()) {
      text("确认").click();
      cnt++;
    }
    sleep(50);
    if (className("android.widget.Button").exists()) {
      break;
    }
    if (cnt % 20 == 0) {
      log("已点击确认次数：" + cnt);
    }
  }

  console.log("② 准备确认支付");
  if (!ISDEBUG) {
    //调试模式时不点击支付按钮
    for (
      let cnt = 0;
      className("android.widget.Button").text("立即支付").exists();
      cnt++
    ) {
      //直接猛点就完事了
      //   var c = className("android.widget.Button").text("立即支付").findOne().click();
      var c = press(payBtn.bounds().centerX(), payBtn.bounds().centerY(), 1);
      sleep(50);
      if (cnt % 20 == 0) {
        log("已点击支付次数：" + cnt);
      }
    }
  } else {
    console.log("调试模式，不点击支付按钮");
  }

  console.log("结束");
  return;
}

function get_delay() {
  let delays = [];
  for (let i = 0; i < 10; i++) {
    let start = new Date().getTime();
    try {
      // HTTP request to maoyan.com
      http.get("https://maoyan.com");
    } catch (e) {
      console.error("Request failed:", e);
      // if request fails, record as large delay
      delays.push(9999);
      continue;
    }
    let end = new Date().getTime();
    delays.push(end - start);
    sleep(200); // small pause between requests
  }

  // sort and remove best (min) and worst (max)
  delays.sort((a, b) => a - b);
  let trimmed = delays.slice(1, -1); // drop first and last
  let sum = trimmed.reduce((acc, v) => acc + v, 0);
  let avg = sum / trimmed.length;

  console.log("Round trip delays:", delays);
  console.log("Average delay (without best & worst): " + avg + " ms");
  return avg;
}
