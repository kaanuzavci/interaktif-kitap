/* ===============================================================
   DOKUN İPUCU — "buraya dokun" işareti (nabız atan halkalar)

   İlk dokunuşa kadar bir öğenin (sprite / görsel) üzerinde durur,
   dokununca kaybolur. Boyut sahneye göre (6cqw) ölçeklenir; konum
   (left/top) ve zIndex çağırandan `style` ile gelir. translate(-50%)
   ile verilen nokta halkanın MERKEZİ olur.
=============================================================== */
function DokunIpucu({ style }) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{ width: '6cqw', height: '6cqw', transform: 'translate(-50%, -50%)', ...style }}
    >
      <span className="animate-dokun-ping absolute inset-0 rounded-full border-2 border-white" />
      <span
        className="animate-dokun-ping absolute inset-0 rounded-full border-2 border-gunes"
        style={{ animationDelay: '0.75s' }}
      />
      <span className="absolute left-1/2 top-1/2 h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/85 shadow" />
    </div>
  )
}

export default DokunIpucu
