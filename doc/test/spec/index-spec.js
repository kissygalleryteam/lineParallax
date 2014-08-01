KISSY.add(function (S, Node,Demo) {
    var $ = Node.all;
    describe('lineparallax', function () {
        it('Instantiation of components',function(){
            var demo = new Demo();
            expect(S.isObject(demo)).toBe(true);
        })
    });

},{requires:['node','kg/lineparallax/2.0.0/']});