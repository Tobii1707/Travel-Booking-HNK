package com.java.web_travel.controller;
import java.util.Map;

import com.java.web_travel.controller.admin.BuildingDTO;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@RestController
@ResponseBody
public class BuildingAPI {
    @RequestMapping(value = "/api/building/", method = RequestMethod.GET)
    //Chuyển đổi data từ server trả ra cho client thành JSON
    @ResponseBody
    public BuildingDTO getBuilding(@RequestParam(value = "name", required = false) String name,
                              @RequestParam(value = "numberOfBasement", required = false) Integer numberOfBasement,
                              @RequestParam(value = "ward", required = false) String ward,
                                   @RequestParam(value = "city", required = false) String city){
        //System.out.println("Received: " + name);
        //Xu ly duoi DB xog roi
        BuildingDTO request = new BuildingDTO();
        request.setName(name);
        request.setNumberOfBasement(numberOfBasement);
        request.setWard(ward);
        request.setCity(city);
        return request;
    }
    //@RequestMapping(value= "/api/building", method = RequestMethod.POST)
    @RequestMapping(value = "/api/building/", method = RequestMethod.POST)
    public String searchBuilding(@RequestBody BuildingDTO buildingBody) {
        //Sau khi xu ly duoi DB, tra ve fontend.
        return "Received params:\n" + buildingBody.toString();
    }

}
