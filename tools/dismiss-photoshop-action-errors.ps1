param(
    [int]$Seconds = 3600,
    [string]$LogPath = (Join-Path (Split-Path -Parent $PSScriptRoot) "photoshop-dialog-dismissals.tsv")
)

Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;

public class PsDialog {
    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);
}
"@

$BM_CLICK = 0x00F5
$WM_KEYDOWN = 0x0100
$WM_KEYUP = 0x0101
$VK_ESCAPE = 0x1B
"time`twindow`tmessage`tbutton" | Set-Content -LiteralPath $LogPath -Encoding UTF8
$end = (Get-Date).AddSeconds($Seconds)

while ((Get-Date) -lt $end) {
    $windows = New-Object System.Collections.ArrayList

    [void][PsDialog]::EnumWindows({
        param($hWnd, $lParam)

        $title = New-Object System.Text.StringBuilder 512
        [void][PsDialog]::GetWindowText($hWnd, $title, 512)
        $titleText = $title.ToString()

        if ([PsDialog]::IsWindowVisible($hWnd) -and (
            $titleText -like "Adobe Photoshop*" -or
            $titleText -eq "메시지" -or
            $titleText -eq "Message" -or
            $titleText -eq "패턴" -or
            $titleText -eq "Pattern" -or
            $titleText -eq "열기" -or
            $titleText -eq "Open" -or
            $titleText -eq "포함 가져오기" -or
            $titleText -eq "Place Embedded" -or
            $titleText -eq "가져오기" -or
            $titleText -eq "Import"
        )) {
            [void]$windows.Add([pscustomobject]@{
                Handle = $hWnd
                Title = $titleText
            })
        }

        return $true
    }, [IntPtr]::Zero)

    foreach ($window in $windows) {
        $children = New-Object System.Collections.ArrayList

        [void][PsDialog]::EnumChildWindows($window.Handle, {
            param($child, $lParam)

            $text = New-Object System.Text.StringBuilder 512
            $class = New-Object System.Text.StringBuilder 128
            [void][PsDialog]::GetWindowText($child, $text, 512)
            [void][PsDialog]::GetClassName($child, $class, 128)

            $textValue = $text.ToString()
            if ($textValue.Length -gt 0) {
                [void]$children.Add([pscustomobject]@{
                    Handle = $child
                    Class = $class.ToString()
                    Text = $textValue
                })
            }

            return $true
        }, [IntPtr]::Zero)

        if (($window.Title -eq "Adobe Photoshop" -or $window.Title -eq "패턴" -or $window.Title -eq "Pattern") -and $children.Count -eq 0) {
            [void][PsDialog]::PostMessage($window.Handle, $WM_KEYDOWN, [IntPtr]$VK_ESCAPE, [IntPtr]::Zero)
            [void][PsDialog]::PostMessage($window.Handle, $WM_KEYUP, [IntPtr]$VK_ESCAPE, [IntPtr]::Zero)
            $line = "{0}`t{1}`t{2}`t{3}" -f (Get-Date -Format o), $window.Title, "opaque modal", "Escape"
            Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
            continue
        }

        $cancelButton = ($children | Where-Object {
            $_.Class -eq "Button" -and (
                $_.Text -eq "취소" -or
                $_.Text -like "Cancel*"
            )
        } | Select-Object -First 1)

        if ($null -ne $cancelButton -and (
            $window.Title -eq "열기" -or
            $window.Title -eq "Open" -or
            $window.Title -eq "포함 가져오기" -or
            $window.Title -eq "Place Embedded" -or
            $window.Title -eq "가져오기" -or
            $window.Title -eq "Import"
        )) {
            [void][PsDialog]::SendMessage($cancelButton.Handle, $BM_CLICK, [IntPtr]::Zero, [IntPtr]::Zero)
            $line = "{0}`t{1}`t{2}`t{3}" -f (Get-Date -Format o), $window.Title, "file dialog", $cancelButton.Text
            Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
            continue
        }

        $message = ($children | Where-Object {
            $_.Text -like "*선택*현재 사용할 수 없습니다*" -or
            $_.Text -like "*명령은 현재 사용할 수 없습니다*" -or
            $_.Text -like "*Select*not currently available*" -or
            $_.Text.Length -gt 20
        } | Select-Object -First 1)

        $button = ($children | Where-Object {
            $_.Class -eq "Button" -and (
                $_.Text -like "정지*" -or
                $_.Text -like "Stop*" -or
                $_.Text -like "확인*" -or
                $_.Text -like "OK*"
            )
        } | Select-Object -First 1)

        if ($null -ne $message -and $null -ne $button) {
            [void][PsDialog]::SendMessage($button.Handle, $BM_CLICK, [IntPtr]::Zero, [IntPtr]::Zero)
            $line = "{0}`t{1}`t{2}`t{3}" -f (Get-Date -Format o), $window.Title, $message.Text, $button.Text
            Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
        }
    }

    Start-Sleep -Milliseconds 200
}
