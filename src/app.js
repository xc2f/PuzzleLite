/**
 * @author Pysics@github
 * @email hellowd93@163.com
 * @create date 2017-10-27 19:53:36
 * @modify date 2017-10-28 01:42:28
 * @desc 拼图小游戏 HTML5 ES6+
 */

'use strict'

import defaultImg from "./utils/defaultImg.js"

let $ = dom => {
  let result = document.querySelectorAll(dom)
  return result.length > 1 ? result : result[0]
}

// 游戏开始前的配置项，包括图片分割的行和列数, 默认图片等
let config = {
  row: 3,
  col: 4,
  selected: 'default-1',
}

window.onload = () => {
  // 将预置的两张图片插入DOM
  $('.imgList img[data-tag="default-1"]').src = defaultImg['default-1']
  $('.imgList img[data-tag="default-2"]').src = defaultImg['default-2']

  initApp()
}

function initApp() {
  // 添加新图片
  $('#imgUpload').addEventListener('change', addImg)

  // 选择默认图片
  $('.imgList').addEventListener('click', selectImg)

  // 设置图片分割数
  $('.grade #divideRow').addEventListener('change', event => {
    // TODO number和parseInt的不同, 事件流 捕获和冒泡
    config.row = Number(event.target.value)
  })
  $('.grade #divideCol').addEventListener('change', event => {
    config.col = Number(event.target.value)
  })

  // 开始游戏
  $('#startGame').addEventListener('click', gameReady)
}

function addImg(event) {
  let files = Array.from(event.target.files)
  files.map(img => {
    let reader = new FileReader()
    reader.readAsDataURL(img)
    reader.onload = e => {
      let img = document.createElement('img')
      img.src = e.target.result
      img.setAttribute('data-tag', new Date().getTime())
      let li = document.createElement('li')
      li.appendChild(img)
      $('.step .imgList').insertBefore(li, $('.step .imgList li')[0])       
    }
  })
  // 将input@file值置空，避免同一文件不触发事件.也无必要
  $('#imgUpload').value = ''
}

function selectImg(event) {
  let target = event.target
  if(target.tagName === 'IMG'){
    config.selected = target.getAttribute('data-tag')
    Array.from(target.parentNode.parentNode.children).map(item => {
      item.removeAttribute('class')
    })
    target.parentNode.setAttribute('class', 'selected')
  }
}

function gameReady() {
  $('.step').classList.add('hide')
  $('.countDown').classList.add('show')

  // let count_down = 3
  let count_down = 1
  let countInterval
  countInterval = setInterval(() => {
    count_down -= 1
    $('.countDown span').innerText = count_down
    if(count_down === 0) {
      clearInterval(countInterval)
      startGame()
    }
  }, 1000)

  // 裁剪图片
  spliceImg()
}

// 裁剪图片
function spliceImg() {
  let img, img_width, img_height, img_list=[]

  // 获取图片信息
  img = $(`.imgList img[data-tag='${config.selected}']`)

  // 解决canvas toDataURL跨域,需启一个本地服务
  // 图片转base64后不需要
  img.crossOrigin = "Anonymous"
  img_width = img.naturalWidth
  img_height = img.naturalHeight

  // init canvas
  let canvas = document.createElement('canvas')
  canvas.width = img_width / config.col
  canvas.height = img_height / config.row
  let ctx = canvas.getContext('2d')

  for(let i=0; i<config.row; i++){
    for(let j=0; j<config.col; j++){
      // 绘制图片碎片
      // 必须是全参数
      ctx.drawImage(img, canvas.width * j, canvas.height * i, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height)
      let src = canvas.toDataURL('image/jpeg', 1)

      img_list.push({
        x: i,
        y: j,
        src: src
      })
    }
  }
  // 随机排列,随机旋转
  // 渲染分割的图片
  renderPiece(randomList(img_list))

  // 渲染网格
  renderGrid(img_width, img_height)
}

function randomList(list) {
  let temp_list = [], angle=[0, 90, 180, 270]
  for (let i = 0, len = list.length; i < len; i++) {
    let j = getRandomNumber(list.length)
    temp_list[i] = list.splice(j, 1)[0]
    temp_list[i].rotate = angle[getRandomNumber(angle.length)]    
  }
  return temp_list  
}

function getRandomNumber(length) {
  return Math.floor(Math.random() * length) 
}

function renderPiece(list) {
  console.log(list)
  let temp_dom = document.createDocumentFragment()
  list.map((item, idx) => {
    let img = document.createElement('img')
    img.src = item.src
    // 随机旋转图片
    img.classList.add(`rotate${item.rotate}`)
    let li = document.createElement('li')
    li.appendChild(img)
    temp_dom.appendChild(li)
  })
  $('#imgPiece ul').appendChild(temp_dom)
  // if(config.row * config.col >= 100){
  //   $('#puzzleBox').classList.add('more100')
  // }
}

function renderGrid(i_w, i_h) {

  // resize
  let puzzle_box = $('#puzzleBox')
  // 求得当前区域可使用的大小
  let max_width = puzzle_box.offsetWidth
  let max_height = puzzle_box.offsetHeight
  let puzzle_wrap = $('#puzzleBox .puzzleWrap')
  // 如果图片长宽比大于1
  if(i_w >= i_h){
    let p_w, p_h
    // 按最长边铺开
    p_w = max_width
    // 由 p_w / p_h === i_w / i_h
    // p_w === max_width
    p_h = max_width * i_h / i_w

    // 再确保高度不会超出范围,超出则等比例缩小
    if (p_h > max_height) {
      p_h = max_height
      p_w = p_h * i_w / i_h
    }
    puzzle_wrap.style.width = p_w + 'px'
    puzzle_wrap.style.height = p_h + 'px'
  } else {
    // 按图片高度铺满区域计算
    puzzle_wrap.style.height = max_height + 'px'
    puzzle_wrap.style.width = max_height * i_w / i_h + 'px'
  }

  // 渲染网格
  let temp_dom = document.createDocumentFragment()
  for(let i=0; i<config.row; i++){
    let ul = document.createElement('ul')
    for(let j=0; j<config.col; j++){
      let li = document.createElement('li')
      ul.appendChild(li)
    }
    temp_dom.appendChild(ul)
  }
  puzzle_wrap.appendChild(temp_dom)

  if(config.col * config.row >= 100){
    puzzle_box.classList.add('more100')
  }
}

function startGame() {
  $('.countDown').classList.remove('show')
}
