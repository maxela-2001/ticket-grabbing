app.launchApp("大麦");
openConsole();
sleep(1000);
while (true) {
  var widget = id(
    "trade_project_detail_purchase_status_bar_container_fl"
  ).findOne();
  while (id("trade_project_detail_purchase_status_bar_container_fl").exists()) {
    widget.click()
    sleep(500);
    click(widget.bounds().centerX()+50, widget.bounds().centerY()+50);
    sleep(500);
  }
  sleep(1000);
}
