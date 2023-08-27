const all = document.querySelector('#textdiv>textarea').value.split('\n');
let j = 0;
let fi = 0;
function check() {
  if (fi) {
    return;
  }
  if (cw().document.querySelectorAll('span.u').length <= 10) {
    setTimeout(() => {
      check();
    }, 100);
    return;
  }
  const val = parseInt(cw().document.querySelectorAll('span.u')[10].textContent
      .split(' ')[2]);
  if (val >= 0) {
    console.log(`${all[j]}\t${val}`);
  }
  j++;
  reload();
  setTimeout(() => {
    check();
  }, 100);
}
function reload() {
  if (j < all.length) {
    document.querySelector('#textdiv>textarea').value = `!test!\n!\n\n${all[j]}`;
    document.querySelector('.goBtn').click();
  } else {
    alert('测试已完成');
    fi = 1;
  }
}
reload();
check();