<?php

namespace App\Enums;

enum AttendanceDayStatus: string
{
    case Holiday = 'holiday';
    case Weekend = 'weekend';
    case Absent = 'absent';
    case Present = 'present';
    case Late = 'late';
    case EarlyLeave = 'early_leave';
    case Incomplete = 'incomplete';
}
