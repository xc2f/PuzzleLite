/**
 * @author Pysics@github
 * @email hellowd93@163.com
 * @create date 2017-10-27 19:53:36
 * @modify date 2017-10-29 16:27:39
 * @desc 拼图小游戏 HTML5 ES6+
 */

'use strict'

import defaultImg from "./utils/defaultImg"
import fromNow,{ computeTime, parseTime } from "./utils/moment";
import './app.css'

let $ = dom => {
  let result = document.querySelectorAll(dom)
  return result.length > 1 ? result : result[0]
}

// 游戏开始前的配置项，包括图片分割的行和列数, 默认图片等
let config = {
  row: 3,
  col: 4,
  selected: 'default-1',
  filename: 'Super-Mario-Odyssey'
}

// 当前正在移动的图片
let draging_img = null

// 图片打乱后的顺序
let img_pos_list = []

// 从顶部移动图片时的原始坐标信息
let o_li = null

// 当前拼图开始时间
let start_time = null
// 计时函数
let game_timing_interval = null
let refresh_records_interval = null

let storage = window.sessionStorage

/**
 * 
 * @param {string} name - node名
 * @param {string} classname - node类名
 * @param {string} id - node id
 * @param {Object} data - data属性，{name: name, value: value}
 */
function createNode(name, text, classname, id, data) {
  let dom = document.createElement(name)
  text && (dom.textContent = text)
  classname && dom.classList.add(classname)
  id && (dom.id = id)
  data && dom.setAttribute(data.title, data.value)
  return dom
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

  // 读取storage中的数据
  getStorage('init')
}

function getStorage(type) {
  if(type === 'init'){
    let records = storage.getItem('records')
    if(records){
      renderRecords(JSON.parse(records))
    }
  }
}

function renderRecords(data) {
  let temp_dom = document.createDocumentFragment()
  data.map((item, idx) => {
    let label = createNode('label', data.length - idx)
    let time = createNode('time', fromNow(item.start_time), '', '', {
      title: 'datetime',
      value: item.start_time
    })
    let span_title = createNode('span', item.file_name, 'title')
    let span_time = createNode('span', item.use_time, 'useTime')
    let li = createNode('li', '', '', '', {
      title: 'title',
      value: new Date(item.start_time)
    })
    li.appendChild(label)
    li.appendChild(time)
    li.appendChild(span_title)
    li.appendChild(span_time)
    temp_dom.appendChild(li)
  })
  $('#records .history').innerText = ''
  $('#records .history').appendChild(temp_dom)
  if(!refresh_records_interval){
    refresh_records_interval = setInterval(() => {
      Array.from(document.querySelectorAll('#records .history time')).map(item => {
        item.innerText = fromNow(Number(item.getAttribute('datetime')))
      })
    }, 1000 * 30)
  }
}

function addImg(event) {
  let files = Array.from(event.target.files)
  files.map(file => {
    let reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = e => {
      let img = document.createElement('img')
      img.src = e.target.result
      img.setAttribute('data-tag', new Date().getTime())
      img.alt = file.name.slice(0, file.name.lastIndexOf('.')) || ' '
      let li = document.createElement('li')
      li.appendChild(img)
      $('.step .imgList').insertBefore(li, $('.step .imgList li')[0])
      // 选中新上传的图片
      selectImg(img, 'add')  
    }
  })
  // 将input@file值置空，避免同一文件不触发事件.也无必要
  $('#imgUpload').value = ''
}

function selectImg(event, type) {
  let target = type==='add' ? event : event.target
  if(target.tagName === 'IMG'){
    config.selected = target.getAttribute('data-tag')
    config.filename = target.getAttribute('alt')
    Array.from(target.parentNode.parentNode.children).map(item => {
      item.removeAttribute('class')
    })
    target.parentNode.setAttribute('class', 'selected')
  }
}

function reset(toHome) {
  $('.puzzleWrap').innerText = ''
  $('#imgPiece ul').innerText = ''
  $('.left .btn-group').innerText = ''
  $('#records .current').innerText = ''
  $('#imgPiece').classList.add('hide')
  if(toHome){
    $('.step').classList.remove('hide')
  } else {
    gameReady()
  }
  gameTiming('reset')
}

// 游戏过程中的计时函数
function gameTiming(type, time_dom, timing_dom) {
  time_dom = time_dom || $('#records .current time')
  timing_dom = timing_dom || $('#records .current span')
  if(type === 'start'){
    timing_dom.innerText = computeTime(new Date().getTime() - start_time)
    game_timing_interval = setInterval(() => {
      time_dom.innerText = parseTime(Number(time_dom.getAttribute('datetime')))
      timing_dom.innerText = computeTime(new Date().getTime() - start_time)
    }, 1000)
  } else if(type === 'complete'){
    // 写入storage
    clearInterval(game_timing_interval)
  } else if (type === 'reset'){
    clearInterval(game_timing_interval)
  }
}

function gameReady() {
  $('.step').classList.add('hide')
  $('.countDown').classList.remove('hide')

  let count_down = 3
  let countInterval
  countInterval = setInterval(() => {
    count_down -= 1
    $('.countDown span').innerText = count_down
    if(count_down === 0) {
      clearInterval(countInterval)
      $('.countDown').classList.add('hide')
      $('.countDown span').innerText = 3
      startGame()
    }
  }, 1000)

  // 裁剪图片
  spliceImg()
}


function startGame() {
  
    bindEvent('#imgPiece ul li img', 'drag')
  
    bindEvent('#puzzleBox .puzzleWrap li', 'drop')
  
    // 左侧按钮
    let btn_to_home = createNode('button', '回到主页')
    let btn_replay = createNode('button', '重新开始')
    let btn_group = $('.left .btn-group')
    btn_group.appendChild(btn_to_home)
    btn_group.appendChild(btn_replay)
    btn_to_home.addEventListener('click', () => reset(true))
    btn_replay.addEventListener('click', () => reset(false))


    // 左侧计时
    let li_title = createNode('li', config.filename, 'name')
    let now = new Date().getTime()
    start_time = now
    let time = createNode('time', fromNow(now), '', '', {
      title: 'datetime',
      value: start_time
    })
    let span = createNode('span', '')
    let li_time = createNode('li', '', 'timing')
    li_time.appendChild(time)
    li_time.appendChild(span)
    let target_dom = $('#records .current')
    target_dom.appendChild(li_title)
    target_dom.appendChild(li_time)
    gameTiming('start', time, span)

    // 开启底部图片
    $('#imgPiece').classList.remove('hide')
    
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

    // 从上面grid移动，存储移动前li坐标，只有上面的格子有
    if(e.target.parentNode.getAttribute('data-x')){
      e.target.style.opacity = .7
      o_li = e.target.parentNode
    }
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
    // dragEnter后，底部已经有了图片，总会是IMG
    if(target.tagName === 'IMG'){
      /**
       * 需判断两个东西
       * 1，拖拽元素的来源，o_li
       * 2，初次放置还是替换，target.getAttribute('data-status')
       */
      // target_img是拖拽后处在新位置的图片      
      let target_img = o_li ? handleSourceFromGrid(target) : handleSourceFromPiece(target)

      target_img && new Drag(target_img)
    }

    // drop后，o_li必须设置为null，因为要用o_li检测拖拽元素的来源
    draging_img = null
    o_li = null
    checkComplete()
  }

  // chrome 下必须阻止enter和over的默认行为，否则drop不触发
  dragEnter(e){
    e.preventDefault()
    // e.stopPropagation()
    let target = e.target
    console.log('================= enter ===================');
    console.log(target.tagName);
    console.log('================= enter ===================');
    // 目标元素是li并且没有子元素，即为空
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
    // e.stopPropagation()
    let target = e.target
    
    console.log('================= leave ===================');
    console.log(target.tagName);
    console.log('================= leave ===================');
    // 离开时，由enter事件，底部为img元素，当且仅当底部图片的状态非drop时
    if(target.tagName === 'IMG' && !target.getAttribute('data-status')){
      let parent_node = target.parentNode
      console.log(parent_node.children)
      parent_node.removeChild(parent_node.children[0])
    }
    // else if (target.tagName === 'LI'){
    //   let child_node = target.children[0]
    //   if(!child_node.getAttribute('data-status')){
    //     target.removeChild(child_node)
    //   }
    // }
  }
}



// TODO 下面两个函数可优化

function handleSourceFromPiece(target) {
  /**
   * target两种情况
   * 一，初次放置，此时是dragEnter事件添加opacity为.7的图片
   * 二，替换，此时图片有data-status='drop'的信息
   */
  let new_img = target
  let parent_node = target.parentNode

  // 目标li元素（grid中的）所处的位置信息，与img_pos_list存储的图片位置做比较
  let p_x = Number(parent_node.getAttribute('data-x'))
  let p_y = Number(parent_node.getAttribute('data-y'))

  // 与img_pos_list存储的图片次序一致
  let img_idx = Number(draging_img.getAttribute('data-idx'))

  // 从底部列表中移除对应图片，仅在从底部拖拽图片时有效
  let ul = $('#imgPiece ul')
  ul.removeChild($(`#imgPiece ul img[data-idx="${img_idx}"]`).parentNode)
  
  if(target.getAttribute('data-status')){
    // 为替换
    let img = document.createElement('img')
    img.src = draging_img.src
    img.style.cssText = 'opacity: 1;'
    img.setAttribute('data-idx', draging_img.getAttribute('data-idx'))
    img.setAttribute('data-status', 'drop')
    // 指向新图片
    new_img = img

    // 移除原有的图片并添加新的
    let parent_node = target.parentNode
    parent_node.removeChild(parent_node.children[0])
    parent_node.appendChild(img)

    // 将图片添加回底部，并重新添加事件
    let li = document.createElement('li')
    target.removeAttribute('data-status')
    new Drag(target)
    li.appendChild(target)
    $('#imgPiece ul').appendChild(li)

    // 恢复在img_pos_list的数据
    let idx = Number(target.getAttribute('data-idx'))
    img_pos_list[idx].sign = false
  } else {
    // 初次放置
    target.src = draging_img.src
    target.style.opacity = 1
    target.setAttribute('data-idx', draging_img.getAttribute('data-idx'))
    target.setAttribute('data-status', 'drop')
  }

  // 检查是否填充到正确的位置，若正确，则img_pos_list对应位置添加一个true标记
  let target_img = img_pos_list[img_idx]
  if(target_img.x === p_x && target_img.y === p_y){

    img_pos_list[img_idx].sign = true
  }

  return new_img
}

function handleSourceFromGrid(target){
  let parent_node = target.parentNode
  
  // 目标li元素（grid中的）所处的位置信息，与img_pos_list存储的图片位置做比较
  let p_x = Number(parent_node.getAttribute('data-x'))
  let p_y = Number(parent_node.getAttribute('data-y'))

  // 与img_pos_list存储的图片次序一致
  let img_idx = Number(draging_img.getAttribute('data-idx'))

  if(target.getAttribute('data-status')){
    if(target.getAttribute('data-idx') === draging_img.getAttribute('data-idx')){
      target.style.opacity = 1
      return
    }
    let img1 = document.createElement('img')
    img1.src = target.src
    img1.style.cssText = 'opacity: 1;'
    img1.setAttribute('data-idx', target.getAttribute('data-idx'))
    img1.setAttribute('data-status', 'drop')
    new Drag(img1)

    o_li.removeChild(o_li.children[0])
    o_li.appendChild(img1)


    let img2 = document.createElement('img')
    img2.src = draging_img.src
    img2.style.cssText = 'opacity: 1;'
    img2.setAttribute('data-idx', draging_img.getAttribute('data-idx'))
    img2.setAttribute('data-status', 'drop')
    new Drag(img2)

    // 移除原有的图片并添加新的
    let parent_node = target.parentNode
    parent_node.removeChild(parent_node.children[0])
    parent_node.appendChild(img2)

    let o_x = Number(o_li.getAttribute('data-x'))
    let o_y = Number(o_li.getAttribute('data-y'))
    let target_img_idx = Number(target.getAttribute('data-idx'))
    let target_img = img_pos_list[target_img_idx]
    if(target_img.x === o_x && target_img.y === o_y){
      img_pos_list[target_img_idx].sign = true
    } else {
      img_pos_list[target_img_idx].sign = false
    }
  } else {
    o_li.removeChild(o_li.children[0])

    target.src = draging_img.src
    target.style.opacity = 1
    target.setAttribute('data-idx', draging_img.getAttribute('data-idx'))
    target.setAttribute('data-status', 'drop')

    new Drag(target)
  }
  // 检查是否填充到正确的位置，若正确，则img_pos_list对应位置添加一个true标记
  let new_img = img_pos_list[img_idx]
  if(new_img.x === p_x && new_img.y === p_y){
    img_pos_list[img_idx].sign = true
  } else {
    img_pos_list[img_idx].sign = false
  }
}

function checkComplete() {
  for(let i=0, len=img_pos_list.length; i<len; i++){
    if(!img_pos_list[i].sign){
      return
    }
  }
  gameTiming('complete')
  $('#puzzleBox').classList.add('complete')
  Array.from($('#puzzleBox li img')).map(item => {
    item.setAttribute('draggable', false)
  })
  // 成绩写入storage
  let records = JSON.parse(storage.getItem('records'))
  if(!records){
    records = []
  }
  records.unshift({
    start_time: start_time,
    use_time: $('#records .current span').innerText,
    file_name: config.filename
  })
  renderRecords(records)
  storage.setItem('records', JSON.stringify(records))
}

