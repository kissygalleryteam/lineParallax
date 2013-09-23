/**
 * @fileoverview 此组件可用于想用easing 来实现 各种动画效果，而不是简简单单的
 *               dom动画而已，（例如：canvas实现的动画，滚动轴平滑移动）可以使
 *               用此组件来实现
 * @author mingzheng.czy@taobao.com
 * @version v0.1
 * @description 简单地实现了最重要的功能，一定程度上的优化，参考KISSY.anim的实
 *              现方式，剔除不必要的功能，减少复杂度
 **/
KISSY.add('gallery/lineParallax/0.5/anim-helper', function(S, Base, Node, anim) {
    var $ = Node.all;


    /*私有变量 start*/
    //anim是带名字的，便于管理
    var animMap = {};

    //执行中的anim数目
    var runingAnimNum = 0;
    var timer = null;

    /*私有变量 end*/

    function AnimHelper(config) {
        var self = this;
        //调用父类构造函数
        AnimHelper.superclass.constructor.call(self, config);
    }
    //方法
    S.extend(AnimHelper, Base, /** @lends anim-helper.prototype*/ {
        /*
         {
         start:0,
         end:100,
         handle:function(){},
         complete：function(){},
         duration:3000,
         easing:'linear'
         }
         */
        add: function(animName, cfg) {
            var animCfg = S.clone(cfg);
            S.mix(animCfg, this.get('defaultCfg'),false);

            if (typeof animCfg['startTime'] === 'undefined') {
                animCfg['startTime'] = S.now();
            }
            if (typeof animMap[animName] === 'undefined') {
                runingAnimNum++;
            }
            animMap[animName] = animCfg;

            //add 后立马执行
            this.run();
        },
        run: function() {
            if (timer === null) {
                timer = setInterval(S.bind(this._frame,this), this.get('interval'));
            }
        },
        stop: function() {
            if (timer !== null) {
                clearInterval(timer);
            }
            timer = null;
        },
        _frame: function() {
            var self=this;
            S.each(animMap,function(animItem,name){
                self._handleAnimItem(name,animItem);
            });
        },
        _handleAnimItem: function(name,animItem) {
            //anim.Easing kissy 1.2版本 backboth算法有bug
            var easing = anim.Easing[animItem['easing']]||anim.Easing['easeNone'],
                startTime = animItem['startTime'],
                handle = animItem['handle'],
                complete = animItem['complete'],
                end = parseFloat(animItem['end']),
                start = parseFloat(animItem['start']),
                duration=animItem['duration'],
                now = S.now(),
                elapsedTime;
            if (now >= startTime + duration) {

                handle(end);
                complete&&complete();
                delete animMap[name];
                runingAnimNum--;
                if (runingAnimNum == 0) {
                    this.stop();
                }
            } else {
                elapsedTime = now - startTime;
                handle(start + parseFloat(((end - start) * easing(elapsedTime / duration)).toFixed(3)));

            }



        }
    }, {
        ATTRS: /** @lends anim-helper.prototype*/
        {
            defaultCfg: {
                value: {
                    duration:1000,
                    easing:'linear'
                }
            },
            interval: {
                value: 15
            }


        }
    })
    return AnimHelper;
}, {
    requires: ['base', 'node', 'anim']
});