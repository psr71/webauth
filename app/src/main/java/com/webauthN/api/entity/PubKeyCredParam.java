package com.webauthN.api.entity;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
public class PubKeyCredParam {

    private String type;
    private int alg;
}
