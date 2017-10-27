/**
 * @author Pysics@github
 * @email hellowd93@163.com
 * @create date 2017-10-27 12:53:36
 * @modify date 2017-10-27 12:57:52
 * @desc 拼图小游戏 HTML5 ES6+
 */

'use strict'

import * as defaultImg from "../images/default.js"

console.log(defaultImg)
 
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
  spliteImg()
}

// 裁剪图片
function spliteImg() {
  let img, imageWidth, imageHeight, imgList=[]

  // 获取图片信息
  img = $(`.imgList img[data-tag='${config.selected}']`)

  // 解决canvas toDataURL跨域,需启一个本地服务
  // 图片转base64后不需要
  img.crossOrigin = "Anonymous"
  imageWidth = img.naturalWidth
  imageHeight = img.naturalHeight

  // init canvas
  let canvas = document.createElement('canvas')
  canvas.width = imageWidth / config.col
  canvas.height = imageHeight / config.row
  let ctx = canvas.getContext('2d')

  for(let i=0; i<config.row; i++){
    for(let j=0; j<config.col; j++){
      ctx.drawImage(img, canvas.width * j, canvas.height * i, canvas.width, canvas.height)
      let src = canvas.toDataURL('image/jpeg', 1)
      imgList.push({
        x: i,
        y: j,
        src: src
      })
    }
  console.log(imgList)
  }
}

function startGame() {
  $('.countDown').classList.remove('show')
}
