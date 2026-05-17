<?php

namespace App\Enums;

enum ZktecoDeviceCommandType: string
{
    case SyncAttendance = 'sync_attendance';
    case PushAllEmployees = 'push_all_employees';
    case PushEmployee = 'push_employee';
    case RemoveEmployee = 'remove_employee';
    case RemoveAllEmployees = 'remove_all_employees';
}
