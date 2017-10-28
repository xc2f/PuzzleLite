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

// 当前正在移动的图片
let draging_img = null

// 图片打乱后的顺序
let img_pos_list = []

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
  let temp_dom = document.createDocumentFragment()
  list.map((item, idx) => {
    let img = document.createElement('img')
    img.src = item.src
    
    // draging_img的data-idx
    img.setAttribute('data-idx', idx)
    img.classList.add(`rotate${item.rotate}`)
    let li = document.createElement('li')
    li.appendChild(img)
    temp_dom.appendChild(li)

    img_pos_list.push({
      x: item.x,
      y: item.y
    })
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
      li.setAttribute('data-x', i)
      li.setAttribute('data-y', j)
      ul.appendChild(li)
    }
    temp_dom.appendChild(ul)
  }
  puzzle_wrap.appendChild(temp_dom)

  if(config.col * config.row >= 100){
    puzzle_box.classList.add('more100')
  }
}


class Drag {
  constructor(el) {
    this.el = el
    this.init()

    // 可以不绑
    this.dragStart = this.dragStart.bind(this);
  }

  init(){
    this.onselectstart()
    // 拖拽开始
    this.el.addEventListener('dragstart', this.dragStart)
    // 拖拽结束
    this.el.addEventListener('dragend', this.dragEnd)

  }
  

  onselectstart(){
    // 取消选择功能
    return false
  }
  dragStart(e){
    e.dataTransfer.effectAllowed = "move";

    // chrome下无效，改用全局传递
    // e.dataTransfer.setData("text", '111111')
    
    draging_img = e.target
    // TODO 优化缩略图显示
    e.dataTransfer.setDragImage(draging_img, 0, 0);
  }
  dragEnd(e){
  }

}

class Drop {
  constructor(el) {
    this.el = el
    this.init()
    // this.dragEnter = this.dragEnter.bind(this);
  }
  init(){
    // 放
    this.el.addEventListener('drop', this.drop)
    // 进入
    this.el.addEventListener('dragenter', this.dragEnter)
    // 移动
    this.el.addEventListener('dragover', this.dragOver) 
    // 离开
    this.el.addEventListener('dragleave', this.dragLeave)
  }

  drop(e){
    let target = e.target
    if(target.tagName === 'IMG'){
      // dragEnter后，底部已经有了图片，总会是IMG
      let is_blank = handleBeforeDrop(target)
      if(is_blank){
        target.src = draging_img.src
        target.style.opacity = 1
        target.setAttribute('data-f_idx', draging_img.getAttribute('data-idx'))
        target.setAttribute('data-status', 'drop')
      } else {
        // 底部有旧的图片，需重新生成图片
        let img = document.createElement('img')
        img.src = draging_img.src
        img.style.cssText = 'opacity: 1;'
        img.setAttribute('data-f_idx', draging_img.getAttribute('data-idx'))
        img.setAttribute('data-status', 'drop')
        let parent_node = target.parentNode
        parent_node.removeChild(parent_node.children[0])
        parent_node.appendChild(img)
        
        target.removeAttribute('data-status')
        let o_idx = target.getAttribute('data-f_idx')
        target.setAttribute('data-idx', o_idx)
        target.removeAttribute('data-f_idx')

        // 将图片添加回底部
        let li = document.createElement('li')
        li.appendChild(target)
        $('#imgPiece ul').appendChild(li)
      }
    }
    draging_img = null
    checkComplete()
  }

  // chrome 下必须阻止enter和over的默认行为，否则drop不触发
  dragEnter(e){
    e.preventDefault()
    let target = e.target
    if(target.tagName === 'LI' && target.children.length === 0){
      let img = document.createElement('img')
      img.src = draging_img.src
      img.style.cssText = 'opacity: .7;'
      target.appendChild(img)
    }
  }

  dragOver(e){
    e.preventDefault()
    
  }

  dragLeave(e){
    e.preventDefault()
    let target = e.target
    if(target.tagName === 'IMG' && !target.getAttribute('data-status')){
      let parent_node = target.parentNode
      parent_node.removeChild(parent_node.children[0])
    }
    //  else if (target.tagName === 'LI'){
    //   let child_node = target.children[0]
    //   if(!child_node.getAttribute('data-status')){
    //     target.removeChild(child_node)
    //   }
    // }
 }
}

function startGame() {
  $('.countDown').classList.remove('show')

  bindEvent('#imgPiece ul li img', 'drag')

  bindEvent('#puzzleBox .puzzleWrap li', 'drop')

  console.log(img_pos_list)
}

function bindEvent(selector, type) {
  let doms = $(selector)
  
  // 如果只返回了一个dom
  if(doms && Array.from(doms).length <= 1 ) {
    doms = [doms]
  }
  for(let i=0, len=doms.length; i<len; i++){
    type === 'drag' ? new Drag(doms[i]) : new Drop(doms[i])
  } 
}

function handleBeforeDrop(old_target_img) {
  // 底部是否为空格子，默认为空
  let target_blank = true
  let parent_node = old_target_img.parentNode

  // 目标li元素所处的位置，与img_pos_list存储的图片位置做比较
  let p_x = Number(parent_node.getAttribute('data-x'))
  let p_y = Number(parent_node.getAttribute('data-y'))

  // 与img_pos_list存储的图片次序一致
  let img_idx = Number(draging_img.getAttribute('data-idx'))

  // 从底部列表中移除对应图片
  let ul = $('#imgPiece ul')
  ul.removeChild($(`#imgPiece ul img[data-idx="${img_idx}"]`).parentNode)
  
  if(old_target_img.getAttribute('data-status')){
    target_blank = false
    //reset 
    new Drag(old_target_img)

    // 恢复在img_pos_list的数据
    let idx = Number(old_target_img.getAttribute('data-f_idx'))
    img_pos_list[idx].sign = false
    // dragEnter还是底部已有图片
  } else {
    // 落在空白格子上

  }
  // 检查是否填充到正确的位置，若正确，则img_pos_list对应位置添加一个true标记
  let target_img = img_pos_list[img_idx]
  if(target_img.x === p_x && target_img.y === p_y){
    img_pos_list[img_idx].sign = true
  }

  return target_blank
}

function checkComplete() {
  for(let i=0, len=img_pos_list.length; i<len; i++){
    if(!img_pos_list[i].sign){
      return
    }
  }
  alert('complete!')
}

