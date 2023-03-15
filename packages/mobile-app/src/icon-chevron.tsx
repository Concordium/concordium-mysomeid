import * as React from "react"
import Svg, { Path } from "react-native-svg"
/* SVGR has dropped some elements not supported by react-native-svg: title */

const SvgComponent = (props: any) => (
  <Svg width={12} height={25} xmlns="http://www.w3.org/2000/svg" {...props}>
    <Path
      d="M.692 2.141 3 0l8.144 12.5L3 25 .692 22.761 7.424 12.5z"
      fill="#686F8A"
      fillRule="evenodd"
    />
  </Svg>
)

export default SvgComponent
