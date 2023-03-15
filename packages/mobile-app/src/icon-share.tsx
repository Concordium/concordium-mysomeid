import * as React from "react"
import Svg, { G, Path } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props: any) => (
  <Svg width={28} height={40} xmlns="http://www.w3.org/2000/svg" {...props}>
    <G fill="none" fillRule="evenodd">
      <Path
        d="M17.991 13h4.134A4.875 4.875 0 0 1 27 17.875v16.25A4.875 4.875 0 0 1 22.125 39H5.875A4.875 4.875 0 0 1 1 34.125v-16.25A4.875 4.875 0 0 1 5.875 13h4.963"
        stroke="#1E2247"
        strokeWidth={2}
      />
      <Path
        d="M15 4.757V21a1 1 0 0 1-2 0V4.713L10.719 8.07a1 1 0 0 1-1.387.267l-.022-.015a1 1 0 0 1-.283-1.368L13.066.643a1 1 0 0 1 1.87.002l.938 1.63 2.745 4.76a.998.998 0 0 1-1.728.997L15 4.757Z"
        fill="#1E2247"
      />
    </G>
  </Svg>
)

export default SvgComponent

