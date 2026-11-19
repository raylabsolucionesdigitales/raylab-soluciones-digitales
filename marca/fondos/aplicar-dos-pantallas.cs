using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)] public struct RaylabScreenRect { public int left, top, right, bottom; }
[ComImport,Guid("B92B56A9-8B55-4E14-9A89-0199BBB6F93B"),InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IRaylabWallpaper {
 void SetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitor,[MarshalAs(UnmanagedType.LPWStr)] string wallpaper);
 [return:MarshalAs(UnmanagedType.LPWStr)] string GetWallpaper([MarshalAs(UnmanagedType.LPWStr)] string monitor);
 [return:MarshalAs(UnmanagedType.LPWStr)] string GetMonitorDevicePathAt(uint index);
 uint GetMonitorDevicePathCount();
 RaylabScreenRect GetMonitorRECT([MarshalAs(UnmanagedType.LPWStr)] string monitor);
}
public class RaylabDualWallpaper {
 public static string Apply(string standard, string ultrawide) {
  var wallpaper=(IRaylabWallpaper)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("C2CF3110-460E-4FC1-B9D0-8A1C0C9CC4BD")));
  string result="";
  try {
   for(uint i=0;i<wallpaper.GetMonitorDevicePathCount();i++) {
    var id=wallpaper.GetMonitorDevicePathAt(i);var rect=wallpaper.GetMonitorRECT(id);
    int width=rect.right-rect.left,height=rect.bottom-rect.top;
    string path=(double)width/height>2 ? ultrawide : standard;
    wallpaper.SetWallpaper(id,path);
    if(!String.Equals(wallpaper.GetWallpaper(id),path,StringComparison.OrdinalIgnoreCase))throw new Exception("Wallpaper verification failed");
    result+="Verified "+width+"x"+height+"; ";
   }
  } finally { Marshal.ReleaseComObject(wallpaper); }
  return result;
 }
}
