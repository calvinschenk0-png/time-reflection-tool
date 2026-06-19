'use client'

import ResponsiveView from '@/components/ResponsiveView'
import { useLogDay, LogDayProps } from './useLogDay'
import LogDayDesktop from './LogDayDesktop'
import LogDayMobile from './LogDayMobile'

export default function LogDay(props: LogDayProps) {
  const s = useLogDay(props)
  return <ResponsiveView desktop={<LogDayDesktop s={s} />} mobile={<LogDayMobile s={s} />} />
}
