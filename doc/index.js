/**
 * @fileoverview 一个基于轴模型的视差组件，可以实现大多常见的视差效果，此组件
 *               只提供各元素的差异化动作管理，简化视差效果开发的复杂度，分开
 *               实现每一个元素的移动（动画，也可能不是动画）效果。如需实现更
 *               易用的组件，可使用此组件封装更高级的功能。
 *               支持组合，不支持继承。
 * @author mingzheng<mingzheng.czy@taobao.com>
 * @module lineParallax
 **/

KISSY.add('gallery/lineParallax/0.5/index', function(S, Base, Node, anim, AnimHelper) {
    var $ = Node.all;
    /**
     animhelper为可以用easing的效果来触发回调函数的工具
     */
    var animHelper= new AnimHelper();
    var prevIndex = 0;

    /*
     映射方程，在使用move而不是anim的时候，也提供easing效果，
     即是dom属性值不是在轴上均匀分布的

     注：实现原理上和anim有些不同，anim是使用AnimHelper来管理，、
     使用合适的频率（easing）来调用move方法，无法做到每个元素有
     自己的easing方式

     TODO: 实现其他easing方程
     */
    var equationMap = {
        linear: function(x) {
            return x;
        }
    }


    /*
     css值的计算器，程序会由supportMap来取得各种属性的计算方式，
     现在只实现3种：
     1、length    12px
     2、num       12
     3、color #333333

     TODO：实现length的其他单位
     TODO: 实现color的其他格式
     TODO：支持其他属性，比如缩写
     */
    var cssCalculatorMap = {
        length: lengthCalculator,
        color: colorCalculator,
        number: numberCalculator
    }

    /*
     supportMap记录了支持的CSS属性
     */
    var supportMap = {
        top: 'length',
        right: 'length',
        bottom: 'length',
        left: 'length',
        marginLeft: 'length',
        marginRight: 'length',
        marginTop: 'length',
        marginBottom: 'length',
        color: 'color',
        backgroundColor: 'color',
        opacity: 'number',
        width: 'length',
        height: 'length',
        backgroundPositionX:'length',
        backgroundPositionY:'length'

    }
    /*
     @param color {string} #333333
     TODO:常用颜色支持 red，blue，green
     */
    function parseColor(color) {
        var colorStr = color.slice(1),
            len;
        len = colorStr.length;
        if (len == 3) {
            colorStr = colorStr[0] + colorStr[0] + colorStr[1] + colorStr[1] + colorStr[2] + colorStr[2];
        }

        r = parseInt(colorStr.slice(0, 2), 16);
        g = parseInt(colorStr.slice(2, 4), 16);
        b = parseInt(colorStr.slice(4, 6), 16);
        return [r, g, b];
    }
    /*
     @param {Array} [255,255,255]
     */
    function stringifyColor(colorArray) {
        var colorStr = "#",
            itemStr;
        S.each(colorArray, function(item) {
            itemStr = item.toString(16);
            if (itemStr.length == 1) {
                itemStr = "0" + itemStr;
            }

            colorStr = colorStr + itemStr;
        });
        S.log(colorStr);
        return colorStr;
    }


    /*
     属性值计算器
     */
    function colorCalculator(start, end, postion) {
        var startArray = parseColor(start),
            endArray = parseColor(end),
            resultArray = [],
            endItem;

        S.each(startArray, function(startItem, i) {
            endItem = endArray[i];
            resultArray.push(Math.floor(startItem + (endItem - startItem) * (postion / 100)));
        });

        return stringifyColor(resultArray);
    }

    function numberCalculator(start, end, postion) {
        return start + (end - start) * (postion / 100);
    }

    function lengthCalculator(start, end, postion) {
        var startNum = parseInt(start),
            endNum = parseInt(end),
            resultNum;

        resultNum = startNum + (endNum - startNum) * (postion / 100);

        return resultNum + 'px';
        //TODO 暂时支持px，以后可以扩展为支持任何单位
    }


    /**
     *
     * @class LineParallax
     * @constructor
     * @extends Base
     */
    function LineParallax(config) {
        var self = this;
        //调用父类构造函数
        LineParallax.superclass.constructor.call(self, config);
    }
    //方法
    S.extend(LineParallax, Base, /** @lends LineParallax.prototype*/ {
        /*
         @param {Object} 添加一个Action到轴上
         @example
         {
         dom:'#selector',//直接传node也行
         regions:[{
         start:'0',
         end:'1000',
         startCss:{
         marginTop:200,

         },endCss:{
         marginTop:51,

         }
         }]
         }
         @description
         1、regions 里面可以有若干个“范围”，当游标处于“范围”内的时候，dom所指定的 若干 个元素会受影响
         2、start，end表示有效区间，其中当游标在区间内的时候，元素的属性会由start，end，startCss，endCss计算出来
         3、同一个批元素（这里使用S.all(dom)所能得到元素）的区间暂时不支持 ‘叠加’
         4、同一个批元素的“动作”最好在一个action里面描述完
         */
        add: function(oAction) {
            var actionList = this.get('actionList');
            actionList.push(oAction);
            this._regionsPreprocess(oAction['regions']);


            this._initAction(oAction);
        },
        /*
         @param {Array} triggers [100,200,300]
         @param {Function} handle function(trigger,direction,start,end){}
         @description
         1、添加钩子，在游标经过轴的指定位置的时候执行handle并且传触发的游标点，
         方向，移动开始，移动结束给handle处理。
         2、用于触发一些无法由本组件统一管理的复杂动作，也可以配合nav
         */
        addHook: function(triggers, handle) {
            var hookList = this.get('hookList');
            hookList.push({
                triggers: triggers,
                handle: handle
            });
        },

        /*
         @param {Number} 游标要移动到的目标位置
         @description LineParallax 最主要的方法，用于控制游标的位置，产生视差效果
         */
        move: function(index) {

            var oldIndex = this.get('index')
            if (index !== oldIndex) {
                //保留老的游标位置，用于游标移动计算方向
                prevIndex = oldIndex;
                this.set('index', index);
                this._handleActions();
                this._handleHooks();
            }
        },
        /*
         @param index {Number} 要游标移动到的目标位置
         @param config {Object} {duration:1000,easing:1500}
         @description 使用AnimHelper 来管理动画，实际上是用缓动的方式来“移动”游标
         */
        anim: function(index, config) {
            ///*-webkit-transition:all 1.5s ease-out 1.5s;*/
            //TODO 支持CSS3优化动画性能
            var cfg=S.mix(config||{},this.get('animCfg'),false);
            cfg['start']=this.getIndex();
            cfg['end']=index;
            cfg['handle']=S.bind(this.move,this);
            animHelper.add('move',cfg);
        },
        stop:function(){
            animHelper.stop();
        },
        getIndex:function(){
            return this.get('index');
        },
        /*
         @param {Object} 一个action
         @description
         初始化操作：
         1、取得并保存 dom
         2、在dom的初次渲染，各就各位到初始位置
         */
        _initAction: function(action) {
            var dom = Node.all(action['dom']),
                regions = action['regions'],
                firstRegion;
            action['dom'] = dom;
            if (!regions || regions.length == 0) {
                S.log('regions 不存在或者为空');
                return;
            }
            firstRegion = regions[0];
            dom.css(firstRegion['startCss']);
        },

        /*
         @description 处理所有action
         */
        _handleActions: function() {
            var actionList = this.get('actionList'),
                self = this,
                regions, dom;
            S.each(actionList, function(action) {
                self._handleAction(action);
            });
        },
        /*
         TODO: 算法改进，智能跳过明显无需加入考虑的region，不对没影响到的元素执行 dom.css操作
         */
        _handleAction: function(action) {
            var start, end, startCss, endCss, indexToStart, endToIndex, dom = action['dom'],
                resultCss = {},
                calculator, index = this.get('index'),
                length = this.get('length'),
                xPercent, yPercent, endValue, resultValue, regions = action['regions'],
                targetRegionIndex, targetRegion, direction = index - prevIndex;
            var len = regions.length;

            /*
             计算命中的regions和命中位置，
             xPercent 为命中的百分比位置0~100
             @example
             1、[0,110] 120 会命中100
             2、[300,400] 120 会命中 0
             3、[100,200] 120 会命中 20
             4、[0,100][400,500] (两个region) 如果在他们中间，计算的时候要考虑direction（方向）
             */
            S.each(regions, function(region, i) {
                start = region['start'];
                end = region['end'];
                indexToStart = index - start;
                endToIndex = end - index;

                if (indexToStart <= 0) {
                    if (i == 0 || direction < 0) {
                        xPercent = 0;
                        targetRegionIndex = i;
                        return false;
                    } else { //direction>0 不可能等于0，等于0的在move那一级就屏蔽掉了
                        xPercent = 100;
                        targetRegionIndex = i - 1;
                        return false;
                    }

                } else {
                    if (endToIndex <= 0) {
                        if (i == len - 1) {
                            xPercent = 100;
                            targetRegionIndex = i;
                            return false;
                        }

                    } else {
                        targetRegionIndex = i;
                        xPercent = (indexToStart / (end - start)) * 100;
                        return false;
                    }
                }
            });

            //根据方程取y值 ，暂时只支持linear，写死
            yPercent = equationMap['linear'](xPercent);

            targetRegion = regions[targetRegionIndex];
            startCss = targetRegion['startCss'];
            endCss = targetRegion['endCss'];

            //根据前面得到的yPercent和startCss，endCss来计算元素此时的属性值
            S.each(startCss, function(startValue, name) {
                endValue = endCss[name];
                resultValue = cssCalculatorMap[supportMap[name]](startValue, endValue, yPercent);
                resultCss[name] = resultValue;
            });



            dom.css(resultCss);

        },
        /*
         区间里面的CSS预处理
         TODO: 允许输入一些特殊值，而不是只有确定的值
         */
        _regionsPreprocess:function(regions){
            var map={},startCss,endCss,lackList=[],overList=[],flag,tmp;
            S.each(regions,function(region,index){
                flag=index-1;
                startCss=region['startCss'];
                endCss=region['endCss'];
                S.each(map,function(mapItem,key){
                    (typeof startCss[key] !=='undefined')||lackList.push(key);
                });

                S.each(endCss,function(cssItem,key){
                    (typeof map[key]!=='undefined')||overList.push(key);
                    map[key]=cssItem;
                });

                S.each(overList,function(key){
                    //map[key]=endCss[key];
                    while(flag>-1){
                        regions[flag]['endCss'][key]=regions[flag]['startCss'][key]=startCss[key];
                        flag--;
                    }
                });

                S.each(lackList,function(key){
                    endCss[key]=startCss[key]=map[key];
                });
                lackList.length=0;
                overList.length=0;
            });
        },
        _handleHooks: function() {
            var hookList = this.get('hookList'),
                self = this;
            S.each(hookList, function(hook) {
                self._handlehook(hook);
            });
        },
        _handlehook: function(hook) {
            var effectedTriggers, start = prevIndex,
                end = this.get('index'),
                triggers = hook['triggers'],
                handle = hook['handle'],
                direction = (end - start > 0) ? 1 : -1;

            effectedTriggers = this._getEffectedTriggers(start, end, triggers);

            S.each(effectedTriggers, function(trigger) {
                /*
                 一般来说需要trigger，和direction就够用了，
                 start，end提供额外的数据，让处理程序能根
                 据位移进行更精细的控制
                 */
                handle(trigger, direction, start, end);
            });

        },

        /*
         @param start {Number} 游标移动的初始值
         @param end {Number} 游标移动的目标值
         @param triggers {Array} 触发器数组 [100,200,300] 当游标移动经过100，200，300的时候会触发
         */
        _getEffectedTriggers: function(start, end, triggers) {
            var leftIndex, //最终选中项 坐标的左侧值 ，比如 1.5~3.5 这个就是 1.5
                rightIndex, //最终选中项 坐标的右侧值 ，比如 1.5~3.5 这个就是 3.5
                startIndex, //由于是双向收集的，所以 可以是 0~len-1，也可能是len-1~0， 这个是左侧值，finishIndex则是右侧值
                finishIndex, triggerPoint, len = triggers.length,
                resultArray = [],
                direction = (end - start > 0) ? 1 : -1;

            startIndex = 0;
            finishIndex = len - 1;
            leftIndex = rightIndex = -1;

            for (; startIndex <= finishIndex; startIndex++) {
                triggerPoint = triggers[startIndex];
                if (end - triggerPoint >= 0) {
                    rightIndex++;
                }
                if (start - triggerPoint >= 0) {
                    leftIndex++;
                }
            }
            /*
             触发顺序须保证，分左右
             */
            var i = Math.min(leftIndex,rightIndex) ;
            var j = Math.max(leftIndex,rightIndex) ;

            for (i++; i <= j; i++) {
                resultArray.push(triggers[i]);
            }

            if(direction<0){
                resultArray.reverse();
            }
            return resultArray;
        }
    }, {
        ATTRS: /** @lends LineParallax*/
        {
            /**
             * 虚拟轴的长度
             * @type {Number} 可以自己设的长度，用法之一是和滚动条长度 1:1 匹配适合做滚动效果，不过更
             * 推荐使用合理的数字，比如5000
             */

            length: {
                value: 1000
            },
            index: {
                value: 0
            },

            /*
             默认的动画配置，设置了这个，可以在anim的时候不传配置，
             AnimHelper内部也有默认配置，所以这个不设也可以
             */
            animConfig: {
                value: null
            },
            /*

             dom:sss//TODO 支持选择器
             regions:[
             {start:0,
             end:1000,
             startCss,
             end:Css}
             ]
             //TODO 支持速度（只是和在单位轴距离下，属性变动的速率） * 待思考
             */
            actionList: {
                value: []
            },

            /*
             同一个hook里面，保证顺序触发，比如如果 100，200，300都触发的话，那他们是顺序的
             不同hook里面不保证顺序触发，触发顺序类似于 hook1 100->200->300 hook2 100->200

             {   顺序写 trigger符合开发者习惯，也更加效率
             triggers:[100,200,300],
             handle:function(index,direction){
             //index 为坐标点 direction为方向
             }
             }
             */
            hookList: {
                value: []
            },
            animCfg: {
                value: {
                    duration:1000,
                    easing:'linear'
                }
            }

        }
    })
    return LineParallax;
}, {
    requires: ['base', 'node', 'anim','./anim-helper']
});

