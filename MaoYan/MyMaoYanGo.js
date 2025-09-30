// 检查无障碍服务是否已经启用，如果没有启用则跳转到无障碍服务启用界面，并等待无障碍服务启动；
// 当无障碍服务启动后脚本会继续运行。
auto.waitFor();
//打开猫眼app
app.launchApp("猫眼");
openConsole();
console.setTitle("猫眼 GO!!!!!");

//是否在测试调试
var ISDEBUG = false;
if (ISDEBUG) {
  console.log("【调试模式开启，正常使用请编辑脚本ISDEBUG值】");
}

console.log("【开始脚本】");
main();
console.log("【结束脚本】");

function main() {
  console.log("请打开演出详情/确认购票页！");
  textMatches(/(猫眼演出详情|确认购票)/).waitFor();

  if (text("确认购票").exists()) {
    console.log("当前在确认购票页，直接准备确认支付！！");
  } else if (text("猫眼演出详情").exists()) {
    console.log("⓪ 确认预约状态");

    var preBook = text("已 预 约").findOne(2000);
    var preBook2 = className("android.widget.TextView")
      .text("已填写")
      .findOne(2000);

    var isPreBook = preBook2 != null || preBook != null;
    console.log("界面是否已预约：" + isPreBook);

    if (!isPreBook) {
      console.log(
        "无预约信息，请提前填写抢票信息再打开脚本!"
      );
      if (!ISDEBUG) {
        return;
      }
    }

    //出现刷新按钮时点击刷新
    threads.start(function () {
      log("刷新按钮自动点击线程已启动");
      for (let cnt = 0; cnt >= 0; cnt++) {
        textContains("刷新").waitFor();
        textContains("刷新").findOne().click();
        if (cnt != 0 && cnt % 5 == 0) {
          console.log("已点击刷新次数：" + cnt);
        }
        //避免点击过快
        sleep(100);
      }
    });

    console.log("等待开抢...");
    // textMatches(/(立即预订|立即购票|特惠购票)/).waitFor(); // 减少循环对CPU开支
    while (true) {
      var but1 = classNameStartsWith("android.widget.")
        .text("立即预订")
        .exists();
      var but2 = classNameStartsWith("android.widget.")
        .text("立即购票")
        .exists();
      var but3 = classNameStartsWith("android.widget.")
        .text("特惠购票")
        .exists();
      //var but4 = classNameStartsWith('android.widget.').text("缺货登记").exists();
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
    let cnt = 0;
    while (true) {
      // 调试模式，模拟选择票档，模拟已预约后自动选择票档
      if (
        ISDEBUG &&
        !text("确认").exists() &&
        textContains("请选择").exists() &&
        cnt == 0
      ) {
        let pd = classNameEndsWith("TextView")
          .textContains("¥")
          .textMatches(/^(?!.*缺货登记).*$/)
          .findOne()
          .click();
      }

      // 文字查找按钮点击，避免未正确配置坐标导致的点击失败
      if (text("确认").exists()) {
        text("确认").findOne().click();
        cnt++;
      } else if (cnt != 0) {
        // break; // 按钮若不复存在时提前结束，避免重复触发
      }
      if (
        textContains("确认购票").exists() ||
        className("android.widget.Button").exists()
      ) {
        break;
      }
      sleep(50);
      if (cnt > 0 && cnt % 20 == 0) {
        log("已点击确认次数：" + cnt);
      }
    }
  }

  console.log("② 准备确认支付");
  className("android.widget.Button").waitFor();
  var payBtn = className("android.widget.Button").text("立即支付").findOne();
  if (ISDEBUG) {
    //调试模式时不点击支付按钮
    console.log("调试模式，不点击支付按钮");
  } else {
    for (let cnt = 0; className("android.widget.Button").exists(); cnt++) {
      //直接猛点就完事了
      // var c1 = payBtn.click();
      // sleep(25);
      var c2 = press(payBtn.bounds().centerX(), payBtn.bounds().centerY(), 25);
      sleep(25);
      if (cnt > 0 && cnt % 20 == 0) {
        log("已点击支付次数：" + cnt);
      }
    }
  }
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
