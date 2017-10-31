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


  $('#root').style.display = 'block'
  initApp()
  document.body.removeChild($('#loading'))
}


function initApp() {
  // 主页布局
  initStepLayout()

  // 添加新图片
  $('#imgUpload').addEventListener('change', addImg)

  // 选择默认图片
  $('.imgList').addEventListener('click', selectImg)

  // 设置图片分割数
  $('.gradeInput p').addEventListener('click', showGradeInput)
  $('.grade #divideRow').addEventListener('input', event => {
    handleInput(event, 'row')
    // TODO number和parseInt的不同, 事件流 捕获和冒泡
    // config.row = Number(event.target.value)
  })
  $('.grade #divideCol').addEventListener('input', event => {
    handleInput(event, 'col')
    // config.col = Number(event.target.value)
  })


  // 开始游戏
  $('#startGame').addEventListener('click', gameReady)

  // 读取storage中的数据
  getStorage('init')

  // 渲染难度格子
  renderSelectGrid()
  // 移动选取事件
  let grid_wrap = $('.gridWrap')
  grid_wrap.addEventListener('mouseover', drawGrid)
  // 确定选择
  grid_wrap.addEventListener('click', e =>{
    drawGrid(e, true)
  })
  grid_wrap.addEventListener('mouseleave', renderSelectGrid)

}



function showGradeInput() {
  $('.gradeInput p').classList.add('hide')
  $('.gradeInput .inputWrap').classList.remove('hide')
  $('#divideRow').focus()
}

function handleInput(e, field) {
  let value = e.target.value
  // if(!value) {
  //   return
  // }

  if(field === 'row'){
    config.row =  Number(e.target.value)
  } else {
    config.col =  Number(e.target.value)
  }
  // 绘制Grid
  renderSelectGrid()

  checkValidateToStartGame()
}

function checkValidateToStartGame(){
  // 防止以0开头但有效的数字
  let row = String(config.row)
  let col = String(config.col)

  // 正则验证
  let row_is_validate = checkValidate(row)
  let col_is_validata = checkValidate(col)

  row_is_validate ? $('#divideRow').classList.remove('invalidata') : $('#divideRow').classList.add('invalidata')
  col_is_validata ? $('#divideCol').classList.remove('invalidata') : $('#divideCol').classList.add('invalidata')
  

  let start_game_btn = $('#startGame')
  if(row_is_validate && col_is_validata){
    start_game_btn.disabled = false
    start_game_btn.classList.remove('disabled')
    let row_x_col = config.row * config.col
    if(row_x_col <= 500){
      $('.inputWrap .warning').innerHTML = '&nbsp;'
    } else if(row_x_col <= 1000){
      $('.inputWrap .warning').innerText = '分割过多会导致卡顿'
    } else {
      $('.inputWrap .warning').innerText = '分割太多会非常卡' 
    }
  } else {
    start_game_btn.disabled = true
    start_game_btn.classList.add('disabled')
    $('.inputWrap .warning').innerText = '请填写大于0的整数'
  }

}

function checkValidate(value) {

  // 开头是0也可以,会以第一位不是0的数字开始,传到这的数字,如果开头有0,已经被截取
  let test = value.match(/^[1-9]\d*/)
  let is_validate = false
  if(test && test[0] === value){
    is_validate = true
  }
  return is_validate
}

function initStepLayout() {
  let w_h = $('#container').offsetHeight
  // 100是底部开始高度，200是中间设置难度的高度, 50是中间的margin，100是上传文件，20未知
  $('.step1 .imgList').style.maxHeight = (w_h - 100 - 200 - 50 * 2 - 100 - 20) + 'px'
  
  let step1_h = $('.step .step1').offsetHeight
  // console.log(step1_h)
  $('.tip .tip2').style.top = step1_h + 100 + 'px'
  $('.tip .tip3').style.top = step1_h + 335 + 'px'
}

function renderSelectGrid() {
  $('.gridWrap').addEventListener('mouseover', drawGrid)
  let dom_li = $('.gridWrap li')
  Array.from(dom_li).map(item => {
    let item_idx = item.getAttribute('data-p').split('')
    if(item_idx[0] > config.row-1 || item_idx[1] > config.col-1){
      item.classList.remove('selected')
    } else {
      item.classList.add('selected')
    }
  })

  let dom_label = $('.gridWrap span.label')
  Array.from(dom_label).map(item => {
    let type = item.getAttribute('data-type')
    let num = Number(item.getAttribute('data-value')) + 1
    if(( num === config.col && type==='col') || ( num === config.row && type==='row') ) {
      item.classList.remove('hidden')
    } else {
      item.classList.add('hidden')
    }
  })
}

function drawGrid(e, confirm) {
  // 绘制grid
  let target = e.target
  if(target.tagName!== 'LI') {
    // 如果点到了格子外部重置mouse over事件
    renderSelectGrid()
    return
  }
  let target_idx = target.getAttribute('data-p').split('')
  
  let dom_li = $('.gridWrap li')
  Array.from(dom_li).map(item => {
    let item_idx = item.getAttribute('data-p').split('')
    if(item_idx[0] > target_idx[0] || item_idx[1] > target_idx[1]){
      item.classList.remove('selected')
    } else {
      item.classList.add('selected')
    }
  })

  // 最外边标记
  let dom_label = $('.gridWrap span.label')
  Array.from(dom_label).map(item => {
    let type = item.getAttribute('data-type')
    let num = item.getAttribute('data-value')
    if(( num === target_idx[1] && type==='col') || ( num === target_idx[0] && type==='row') ) {
      item.classList.remove('hidden')
    } else {
      item.classList.add('hidden')
    }
  })
  if(confirm){
    $('.gridWrap').removeEventListener('mouseover', drawGrid)
    let row = Number(target_idx[0]) + 1
    let col = Number(target_idx[1]) + 1
    config.row = row
    config.col = col
    $('#divideRow').value = row
    $('#divideCol').value = col
    // 重新检查输入的合法值,刷新UI
    checkValidateToStartGame()
  }
}

function getStorage(type) {
  if(type === 'init'){
    let records = storage.getItem('records')
    if(records){
      $('.tip').classList.add('hide')
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

/**
 * 
 * @param {nodeEvent} event - dom事件
 * @param {func} callback - 拼图完成后从当前页新上传图片添加完后的事件回调
 */
function addImg(event, callback) {
  let files = Array.from(event.target.files)
  Array.from(files).map(file => {
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
      selectImg(img, 'add', callback && callback)
    }
  })
  // 将input@file值置空，避免同一文件不触发事件.也无必要
  $('#imgUpload').value = ''
  
  setTimeout(function() {
    // 重置UI，左边的指示高度
    initStepLayout()
  }, 200);
}

function selectImg(event, type, callback) {
  let target = type==='add' ? event : event.target
  if(target.tagName === 'IMG'){
    config.selected = target.getAttribute('data-tag')
    config.filename = target.getAttribute('alt')
    Array.from(target.parentNode.parentNode.children).map(item => {
      item.removeAttribute('class')
    })
    target.parentNode.setAttribute('class', 'selected')
    callback && callback()
  }
}

function reset(toHome) {
  $('.puzzleWrap').innerText = ''
  $('#imgPiece ul').innerText = ''
  $('.left .btn-group').innerText = ''
  $('.left .btn-group').classList.add('hide')
  $('#records .current').innerText = ''
  $('#imgPiece').classList.add('hide')
  $('#puzzleBox').classList.remove('complete')
  let records_height = $('.left').offsetHeight - 30
  $('#records').style.height = records_height + 'px'
  $('#records .history').style.height = (records_height - 10) + 'px'
  // start_time = null
  img_pos_list =[]
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
  $('.tip').classList.add('hide')

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
  renderImg()
}


function startGame() {
  
    bindEvent('#imgPiece ul li img', 'drag')
  
    bindEvent('#puzzleBox .puzzleWrap li', 'drop')
  
    // 左侧按钮
    let btn_to_home = createNode('button', '回到主页', 'backHome')
    let btn_replay = createNode('button', '重新开始', 'rePlay')
    let btn_group = $('.left .btn-group')
    btn_group.appendChild(btn_replay)
    btn_group.appendChild(btn_to_home)
    btn_to_home.addEventListener('click', () => reset(true))
    btn_replay.addEventListener('click', () => reset(false))
    $('.left .btn-group').classList.remove('hide')
    let records_height = $('.left').offsetHeight - 180 - 30
    $('#records').style.height = records_height + 'px'
    $('#records .history').style.height = (records_height - 30) + 'px'

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
    $('#imgPiece .rest').innerText = `${img_pos_list.length}/${img_pos_list.length}`
    
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
function renderImg() {
  let img
  // 获取图片信息
  img = $(`.imgList img[data-tag='${config.selected}']`)

  if(img.complete){
    canvasToImg(img)
  } else {
    img.onload = () => {
      canvasToImg(img)
    }
  }
}

function canvasToImg(img) {
  let img_width, img_height, img_list=[]
  // 解决canvas toDataURL跨域,需启一个本地服务
  // 图片转base64后不需要
  // img.crossOrigin = "Anonymous"
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
    // 目标元素是li并且没有子元素，即为空
    if(draging_img &&  target.tagName === 'LI' && target.children.length === 0){
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
    
    // 离开时，由enter事件，底部为img元素，当且仅当底部图片的状态非drop时
    if(target.tagName === 'IMG' && !target.getAttribute('data-status')){
      let parent_node = target.parentNode
      // console.log(parent_node.children)
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
// =========================================
// 如何检测图片被正确填充
// 1，图片分割后被打乱时，保存有自己正确位置的信息，存储在img_pos_list内的item上
// 2，按img_pos_list内打乱的顺序渲染图片，为底部图片列表的顺序
// 3，图片被放置在格子时，用自己在img_pos_list内保存的原始正确位置信息和格子的坐标做对比，相同则放置正确
// =========================================
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
  // 底部剩余图片数
  $('#imgPiece .rest').innerText = `${$('#imgPiece ul').children.length}/${img_pos_list.length}`

  // 是否完成
  for(let i=0, len=img_pos_list.length; i<len; i++){
    if(!img_pos_list[i].sign){
      return
    }
  }
  $('#imgPiece .rest').innerText = ''

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

  // 底部信息
  let div = createNode('div', '恭喜，用时' + $('.current .timing span').innerText + '！', 'complete')
  let input = document.createElement('input')
  input.id = 'uploadImg'
  input.type = 'file'
  input.accept = 'image/png, image/jpeg, image/gif'
  let label = createNode('label', '上传新图片', '', '', {
    title: 'for',
    value: 'uploadImg'
  })
  div.appendChild(input)
  div.appendChild(label)
  $('#imgPiece ul').appendChild(div)

  input.addEventListener('change', e => {
    addImg(e, reset)
  })
}

