const all = document.querySelector('#textdiv>textarea').value.split('\n');
let j = 0;
let fi = 0;

function check() {
  if (fi) {
    return;
  }
  if (cw().document.querySelectorAll('span.u').length <= 100) {
    setTimeout(() => {
      check();
    }, 500);
    return;
  }
  const progress = cw().document.querySelectorAll('span.u');
  let pos = -1;
  for (let i = 100; i < progress.length; i++) {
    const element = progress[i];
    if (element.textContent.split(' ')[0] === '》') {
      pos = i;
      break;
    }
  }
  if (pos == -1) {
    setTimeout(() => {
      check();
    }, 500);
    return;
  }
  const val = parseInt(progress[pos].textContent.split(' ')[2]);
  if (val >= 0) {
    console.log(all[j] + '\t' + val);
  }
  j++;
  reload();
  setTimeout(() => {
    check();
  }, 500);
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