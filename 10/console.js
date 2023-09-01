const all = document.querySelector('#textdiv>textarea').value.split('\n');
let j = 0;
let fi = 0;
let result = "";
let cur = "";
function check() {
  if (fi) {
    return;
  }
  if (cw().document.querySelectorAll('span.u').length <= 10) {
    setTimeout(() => {
      check();
    }, 50);
    return;
  }
  const val = parseInt(cw().document.querySelectorAll('span.u')[10].textContent
      .split(' ')[2]);
  if (cur != cw().document.querySelectorAll('div.name')[1].textContent) {
    if (val >= 0) {
      result+=(`${all[j]} ${val}`)+"\n";
    }
    j++;
    cur = cw().document.querySelectorAll('div.name')[1].textContent;
    document.querySelector('textarea#result').value = result;
    reload();
  }
  setTimeout(() => {
    check();
  }, 50);
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
const NW = document.createElement('textarea');
NW.id = 'result';
document.body.appendChild(NW);
NW.setAttribute('readonly', true);
document.getElementsByClassName('mdframe')[0].setAttribute('style',
    'display:none;');
reload();
check();