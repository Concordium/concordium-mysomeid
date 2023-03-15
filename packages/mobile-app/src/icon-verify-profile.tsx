import * as React from "react"
import Svg, { G, Path, Ellipse, Circle } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props: any) => (
  <Svg width={42} height={41} xmlns="http://www.w3.org/2000/svg" {...props}>
    <G fill="none" fillRule="evenodd">
      <G transform="translate(2 2)">
        <Path
          d="M39.076 37.798a2.95 2.95 0 0 0-.26-4.146L26.848 23 23 27.404l11.968 10.652a2.897 2.897 0 0 0 4.108-.258Z"
          fill="#1E2354"
        />
        <Ellipse
          stroke="#1E2354"
          strokeWidth={3}
          cx={14.5}
          cy={15}
          rx={14.5}
          ry={15}
        />
      </G>
      <G transform="translate(10 10)" fill="#1E2354">
        <Circle cx={6.5} cy={3.5} r={3.5} />
        <Path d="M13 11.586C13 8.5 10.09 6 6.5 6S0 8.5 0 11.586V13h13" />
      </G>
    </G>
  </Svg>
)

export default SvgComponent
