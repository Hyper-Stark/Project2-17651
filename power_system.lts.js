const PLUGGED_OUT = 0
const PLUGGED_IN = 1
range PLUGGED = PLUGGED_OUT..PLUGGED_IN

const BATTERY_OFF = 0
const BATTERY_ON = 1
range BATTERY_SWITCH = BATTERY_OFF..BATTERY_ON

const BATTERY_OUT = 0
const BATTERY_OK = 1
range BATTERY_STATUS = BATTERY_OUT..BATTERY_OK

const POWER_UNAVAILABLE = 0
const POWER_READY = 1
range POWER = POWER_UNAVAILABLE..POWER_READY

const ParamsNotSet = 2    // pump parameters not set yet
const ParamsSet    = 3    // pump parameters already set
range ParamsStateT = ParamsNotSet .. ParamsSet

AC_POWER = AC[PLUGGED_OUT][POWER_UNAVAILABLE],
AC[plug: PLUGGED][ac_on: POWER] =
(
    when (plug == PLUGGED_OUT)
        plug_in -> AC[PLUGGED_IN][POWER_UNAVAILABLE]
    |
    when (plug == PLUGGED_IN && ac_on == POWER_UNAVAILABLE)
        switch_to_battery -> AC[plug][ac_on]
    |
    when (plug == PLUGGED_IN && ac_on == POWER_UNAVAILABLE)
        ac_power_on -> AC[plug][POWER_READY]
    |
    when (plug == PLUGGED_IN && ac_on == POWER_READY)
        ac_power_on -> AC[plug][ac_on]
    |
    when (plug == PLUGGED_IN && ac_on == POWER_READY)
        ac_power_out -> AC[plug][POWER_UNAVAILABLE]
    |
    when (plug == PLUGGED_IN)
        plug_out -> AC[PLUGGED_OUT][POWER_UNAVAILABLE]
).

BATTERY_SYSTEM = 
(
    plug_out -> BATTERY_SYSTEM
    |ac_power_on -> BATTERY_SYSTEM
    |switch_to_battery -> BS[BATTERY_OFF][BATTERY_OUT]
    |switch_to_battery -> BS[BATTERY_OFF][BATTERY_OK]
),
BS[battery_switch: BATTERY_SWITCH][battery_status: BATTERY_STATUS] = 
(
    // have battery --> keep working
    plug_out -> BS[battery_switch][battery_status]
    // when the battery is working but the ac power works, it should turn to ac power
    |ac_power_on -> BATTERY_SYSTEM
    |
    when (battery_switch == BATTERY_OFF)
        check_battery -> BS[BATTERY_ON][battery_status]
    |
    when (battery_switch == BATTERY_ON && battery_status == BATTERY_OUT)
        recharge -> BS[BATTERY_ON][BATTERY_OK]
    |
    when (battery_switch == BATTERY_ON && battery_status == BATTERY_OK)
        battery_on -> BS[battery_switch][battery_status]
    |
    when (battery_switch == BATTERY_ON && battery_status == BATTERY_OK)
        battery_out -> BS[battery_switch][BATTERY_OUT]
).
||POWER_SYSTEM = (AC_POWER || BATTERY_SYSTEM).