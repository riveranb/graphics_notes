// 極簡 WebGL 片段著色器預覽器。零依賴、純前端。
// 用法：<canvas data-frag="...GLSL fragment source..."></canvas>，載入本檔即自動啟動。
// 固定提供一個全螢幕 quad、varying vec2 vUv（0~1）、uniform float uTime（秒）。
// 這正是課文教的 GLSL ES 1.00 方言：attribute / varying / gl_FragColor。
(function () {
    var VERT = [
        'attribute vec2 aPos;',
        'varying vec2 vUv;',
        'void main() {',
        '    vUv = aPos * 0.5 + 0.5;',       // clip [-1,1] → UV [0,1]
        '    gl_Position = vec4(aPos, 0.0, 1.0);',
        '}'
    ].join('\n');

    function compile(gl, type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            var log = gl.getShaderInfoLog(s);
            gl.deleteShader(s);
            throw new Error(log);
        }
        return s;
    }

    function fail(canvas, msg) {
        canvas.dataset.compiled = 'error';
        canvas.dataset.shaderError = msg;
        var pre = document.createElement('pre');
        pre.style.cssText = 'color:#c62828;font-size:0.75rem;white-space:pre-wrap;margin:0.4em 0';
        pre.textContent = 'Shader 編譯錯誤：\n' + msg;
        canvas.parentNode.insertBefore(pre, canvas.nextSibling);
    }

    function start(canvas) {
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) { fail(canvas, '這個瀏覽器沒有 WebGL'); return; }

        var prog = gl.createProgram();
        try {
            gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
            gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, canvas.dataset.frag));
        } catch (e) { fail(canvas, e.message); return; }
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            fail(canvas, gl.getProgramInfoLog(prog)); return;
        }
        gl.useProgram(prog);

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        // 兩個三角形填滿整個畫面
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
        ]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        // 兩個時間 uniform：uTime（通用）與 cc_time（vec4，模擬 Cocos 內建，x=秒數）。
        // shader 用哪個都行；沒宣告的那個 location 會是 null、自動略過。
        var uTime = gl.getUniformLocation(prog, 'uTime');
        var ccTime = gl.getUniformLocation(prog, 'cc_time');
        var t0 = performance.now();
        canvas.dataset.compiled = 'ok';

        function frame() {
            if (!canvas.isConnected) { return; }
            var t = (performance.now() - t0) / 1000;
            if (uTime) { gl.uniform1f(uTime, t); }
            if (ccTime) { gl.uniform4f(ccTime, t, 0.016, t * 60.0, t - Math.floor(t)); }
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(frame);
        }
        frame();
    }

    function init() {
        document.querySelectorAll('canvas[data-frag]').forEach(start);
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
