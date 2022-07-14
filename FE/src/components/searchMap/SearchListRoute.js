import React from "react";
import dragFunction from "./DragAndDrop";
import styled from "styled-components";

const fetchAddTravelRoute = async (id, route) => {
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.hostname}:8443/projects/routes/${id}`,
      {
        method: "post",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(route),
      }
    );
    const data = await response.json();
    console.log(data);
    // return response.json();
  } catch (error) {
    console.log(error);
  }
};

const SearchListRoute = ({ projectId, route, idx }) => {
  const onClickAddRoute = () => {
    fetchAddTravelRoute(projectId, route);
  };

  return (
    <StyledLi
      draggable
      onDragOver={(event) => {
        return dragFunction(event, "over");
      }}
      onDrop={(event) => dragFunction(event, "drop")}
      onDragEnter={(event) => dragFunction(event, "enter")}
      onDragLeave={(event) => dragFunction(event, "leave")}
      className="dragAndDrop"
      key={idx}
    >
      {/* <span>{i + 1}</span> */}
      <button onClick={onClickAddRoute}>추가하기</button>
      <StyledTile>{route.place_name}</StyledTile>
      {route.road_address_name ? (
        <div>
          <p title={route.road_address_name}>{route.road_address_name}</p>
          {/* <p title = {route.address_name}>{route.address_name}</p> */}
        </div>
      ) : (
        <p>{route.address_name}</p>
      )}
      <p>{route.category_group_name}</p>
      <p>{route.phone}</p>
      <a target="_blank" href={route.place_url}>
        카카오맵에서 상세보기
      </a>
      {/* {route.road_address_name
          ? GetGooglePlaceId({
              input: route.road_address_name + "" + route.place_name,
              id: route.id,
              place_name: route.place_name,
              road_address_name: route.road_address_name,
              category_group_name: route.category_group_name,
              phone: route.phone,
              place_url: route.place_url,
            })
          : GetGooglePlaceId({
              input: route.address_name + "" + route.place_name,
              id: route.id,
              place_name: route.place_name,
              road_address_name: route.address_name,
              category_group_name: route.category_group_name,
              phone: route.phone,
              place_url: route.place_url,
            })} */}
    </StyledLi>
  );
};
const StyledLi = styled.li`
  border-bottom: 2px solid #ebebeb;
  padding-top: 20px;
  padding-bottom: 10px;
  padding-left: 12px;
`;

const StyledTile = styled.h2`
  font-style: normal;
  font-weight: 700;
  font-size: 18px;
  color: #2d56bc;
  margin-bottom: 14px;
`;

export default SearchListRoute;
