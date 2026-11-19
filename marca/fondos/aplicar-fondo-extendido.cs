using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)] public struct RaylabSpanRect { public int left,top,right,bottom; }
[ComImport,Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IRaylabSpanWallpaper {
 void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitor,[MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
 [return:MarshalAs(UnmanagedType.LPWStr)] string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitor);
 [return:MarshalAs(UnmanagedType.LPWStr)] string GetMonitorDevicePathAt(uint index);
 uint GetMonitorDevicePathCount();
 RaylabSpanRect GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitor);
 void SetBackgroundColor(uint color);
 uint GetBackgroundColor();
 void SetPosition(int position);
 int GetPosition();
}
public class RaylabSpannedWallpaper {
 public static string Apply(string path) {
  var desktop=(IRaylabSpanWallpaper)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("C2CF3110-460E-4FC1-B9D0-8A1C0C9CC4BD")));
  try {
   desktop.SetWallpaper(null,path);
   desktop.SetPosition(5);
   if(desktop.GetPosition()!=5)throw new Exception("Span mode verification failed");
   string result="Span mode verified; ";
   for(uint i=0;i<desktop.GetMonitorDevicePathCount();i++){
    string id=desktop.GetMonitorDevicePathAt(i);
    if(!String.Equals(desktop.GetWallpaper(id),path,StringComparison.OrdinalIgnoreCase))throw new Exception("Wallpaper verification failed");
    var rect=desktop.GetMonitorRECT(id);
    result+="Verified "+(rect.right-rect.left)+"x"+(rect.bottom-rect.top)+"; ";
   }
   return result;
  } finally { Marshal.ReleaseComObject(desktop); }
 }
}
