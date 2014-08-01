## 综述

###lineParallax###

* 版本：2.0.0
* 作者：mingzheng
* demo：[http://kg.kissyui.com/lineParallax/2.0.0/demo/index.html](http://kg.kissyui.com/lineParallax/2.0.0/demo/index.html)

一个以轴为模型的视差组件，也可以称之为 **动作管理组件** ，通过对一些元素的动作进行管理，可以实现多个元素互相协作的效果，
最常见的应用方式是视差，进一步可以实现一部用脚本实现的动画片（可回放，可定点停止，可快进）

本着简单原则，此组件只提供各元素的动作管理，没有绑定滚轮等事件。 如需实现视差的效果须自己绑定浏览器事件，
然后在回调里面调用本组件的 *move* 和 *anim* 方法。

如需实现更高级的组件，可使用此组件封装更高级的功能。甚至可以实现一个动画编辑器（所见即所得的方式添加动作）。

###概念模型###

![](http://gtms01.alicdn.com/tps/i1/T1ijS1FgJgXXb.kYcG-12.0.0-497.png)

## 初始化组件

    S.use('kg/lineParallax/2.0.0/index', function (S, LineParallax) {
         var line = new LineParallax();
    })

## API说明

###*add(action)*###
  
挂载动作到轴上（只添加关键帧）

#### 示例 ####

    //添加元素动作，区间试动作管理
    /*
     1、regions 里面可以有若干个“范围”，当游标处于“范围”内的时候，dom所指定的 若干 个元素会受影响
     2、start，end表示有效区间，其中当游标在区间内的时候，元素的属性会由start，end，startCss，endCss计算出来
     3、同一个批元素（这里使用S.all(dom)所能得到元素）的区间暂时不支持 ‘叠加’
     4、同一个批元素的“动作”最好在一个action里面描述完
     */
     line.add({dom:'#12',
               regions:[{
                  start:'0',
                  end:'300',
                  startCss:{
                     top:-100,
                  },endCss:{
                     top:0,
                  }
             }]
     });
                
  
###*addHook(hooklist,callback)*###

添加钩子（触发器）到轴的某些位置,在游标经过的时候触发回调，并传入所需参数

此方法可多次调用，一次添加的钩子须保持顺序

#### 示例 ####

    //添加钩子，游标经过某点的时候触发，你可以得到触发点的值，游标方向，游标起始，游标目标位置
    line.addHook([600,1000,2000],function(triger, direction, start, end){
            console.log(triger);
    });
    
###*move(index),anim(index,animOption)*###

关键方法，用于管理游标的位置，其中：

*move* ： 

即时让游标达到指定位置，此方法可以绑定 *scroll事件* ，*wheel事件* ，*setTimeout* 等，可以很自由地管理那些挂载的动作

*amin* :

让游标以动画的方式（使用 *Easing* ）移动到指定位置，其实就是个语法糖，相当于 （ *setTimeout* + *Easing* + *move方法*）
参数 *animOption* 和与 *KISSY.Anim* 类似，支持 *duration* 和 *easing*

#### 示例 ####

    line.move(1000);
    line.anim(2000);
    line.anim(2000,{
                    duration:1000,
                    easing:'linear'
                });

###*getIndex*###

辅助功能，返回现在游标所在的位置

## 其他信息 ##

* 【大小】 压缩后 2.3KB 
* 【兼容】 本组件只是一些算法+kissy 方法，理论上无兼容性问题
* 【注意】 需要一定的计算量，于IE6,7等浏览器，谨慎使用
