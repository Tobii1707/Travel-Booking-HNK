package com.java.web_travel.controller.admin;

public class BuildingDTO {
    private String name; // ✅ Đúng quy tắc camelCase
    private String ward;
    private Integer numberOfBasement;
    private String city;

    public String getCity(){

        return city;
    }
    public void setCity(String city){

        this.city = city;
    }
    public String getName() {

        return name;
    }

    public void setName(String name) {

        this.name = name;
    }

    public String getWard() {

        return ward;
    }

    public void setWard(String ward) {

        this.ward = ward;
    }

    public Integer getNumberOfBasement() {

        return numberOfBasement;
    }

    public void setNumberOfBasement(Integer numberOfBasement) {

        this.numberOfBasement = numberOfBasement;
    }

    @Override
    public String toString() {
        return "BuildingDTO{" +
                "name='" + name + '\'' +
                ", numberOfBasement=" + numberOfBasement +
                ", ward='" + ward + '\'' +
                '}';
    }
}

