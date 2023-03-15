import * as React from "react"
import Svg, { G, Rect, Path } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props: any) => (
  <Svg width={54} height={54} xmlns="http://www.w3.org/2000/svg" {...props}>
    <G fill="none" fillRule="evenodd">
      <Rect fill="#D8D8D8" x={2.5} y={3} width={49} height={49} rx={15} />
      <Path
        d="M50.01 0H3.99C1.784 0 0 1.73 0 3.869V50.13C0 52.27 1.785 54 3.99 54h46.02c2.205 0 3.99-1.736 3.99-3.869V3.87C54 1.73 52.215 0 50.01 0ZM16.37 45.205H8.21v-24.38h8.16v24.38ZM12.294 17.49h-.055c-2.738 0-4.507-1.873-4.507-4.216 0-2.391 1.824-4.21 4.617-4.21 2.789 0 4.508 1.819 4.563 4.21-.006 2.348-1.774 4.216-4.618 4.216Zm33.491 27.714H37.63V32.16c0-3.28-1.179-5.516-4.132-5.516-2.26 0-3.599 1.51-4.183 2.964-.22.518-.27 1.246-.27 1.973V45.2h-8.16s.104-22.098 0-24.385h8.155v3.455c1.08-1.658 3.02-4.028 7.35-4.028 5.367 0 9.395 3.483 9.395 10.977v13.987ZM28.99 24.38c.03-.028.06-.064.1-.1v.1h-.1Z"
        fill="#1E2246"
        fillRule="nonzero"
      />
    </G>
  </Svg>
)

export default SvgComponent
