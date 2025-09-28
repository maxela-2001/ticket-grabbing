while (true) {
  var payBtn = classNameStartsWith("android.widget.")
    .text("立即支付")
    .findOne();
  if (payBtn != null) {
    press(payBtn.bounds().centerX(), payBtn.bounds().centerY(), 1);
  }
  sleep(1000 / 30);
}
