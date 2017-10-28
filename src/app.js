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

  let count_down = 3
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
}

function randomList(list) {
  let temp_list = []
  for (let i = 0, len = list.length; i < len; i++) {
    let j = Math.floor(Math.random() * list.length)
    temp_list[i] = list.splice(j, 1)[0]
  }
  return temp_list  
}

function renderPiece(list) {
  let ul, temp_dom = document.createDocumentFragment(), angle=[0, 90, 180, 270]
  list.map((item, idx) => {
    // let img = document.createElement('img')
    // img.src = item.src
    // 随机旋转图片
    let random_factor = Math.floor(Math.random() * 3)
    img.classList.add(`rotate${angle[random_factor]}`)
    item.rotate = angle[random_factor]

    let li = document.createElement('li')
    li.appendChild(img)
    // 每行第一列时新建一个ul节点
    if(item.y === 0){
      ul = document.createElement('ul')
    }
    ul.appendChild(li)
    // 最后一列时将ul推入临时dom
    if(item.y === config.col-1){
      temp_dom.appendChild(ul)
    }
  })
  $('#gameWrap').appendChild(temp_dom)
  if(config.row * config.col >= 100){
    $('#gameWrap').classList.add('more100')
  }
}

function startGame() {
  $('.countDown').classList.remove('show')
}
