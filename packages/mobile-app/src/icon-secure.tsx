import * as React from "react"
import Svg, { G, Path } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props: any) => (
  <Svg width={36} height={42} xmlns="http://www.w3.org/2000/svg" {...props}>
    <G fillRule="nonzero" fill="none">
      <Path
        d="M18 2 2 8.91v10.363C2 28.859 8.827 37.823 18 40c9.173-2.176 16-11.14 16-20.727V8.909L18 2Z"
        stroke="#1C2150"
        strokeWidth={3}
      />
      <Path
        fill="#1C214F"
        d="m17.529 30.411-8.182-5.534 2.021-2.788 5.294 3.567 9.445-13.03 2.887 1.968z"
      />
    </G>
  </Svg>
)

export default SvgComponent

